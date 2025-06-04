import { NextResponse } from 'next/server';
import { db } from '@/firebase/configure';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    // 1. Get and verify authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId; // Assuming your JWT contains userId

    console.log('Decoded user ID:', userId);

    // 2. Fetch only orders belonging to this user
    const ordersSnapshot = await db.collection('pesanan')
      .where('userId', '==', userId) // Filter by user ID
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
      };
    });

    return NextResponse.json(orders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}