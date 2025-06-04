// app/api/orders/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/firebase/configure';
import { collection, query, where, getDocs } from 'firebase/firestore';

const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export async function GET(request) {
  try {
    // Get token from header
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Get orders from Firestore
    const ordersRef = collection(db, 'pesanan');
    const q = query(ordersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const orders = [];
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({
        id: doc.id,
        ...orderData,
        // Convert Firestore Timestamp to JavaScript Date
        createdAt: orderData.createdAt?.toDate().toISOString(),
        updatedAt: orderData.updatedAt?.toDate().toISOString()
      });
    });

    return NextResponse.json(orders);
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get token from header
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const orderData = await request.json();
    
    // Validate required fields
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!orderData.shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    if (!orderData.payment?.method) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Create new order in Firestore
    const ordersRef = collection(db, 'pesanan');
    const newOrder = {
      userId,
      ...orderData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(ordersRef, newOrder);

    return NextResponse.json(
      { 
        id: docRef.id,
        message: 'Order created successfully',
        order: {
          ...newOrder,
          createdAt: newOrder.createdAt.toISOString(),
          updatedAt: newOrder.updatedAt.toISOString()
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}