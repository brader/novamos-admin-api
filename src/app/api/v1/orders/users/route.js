// app/api/orders/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Mock database - replace with your actual Firestore connection
const db = {
  orders: [
    // Sample data structure
    {
      id: 'order1',
      userId: 'user1',
      items: [{ productId: 'prod1', quantity: 2 }],
      status: 'pending',
      createdAt: new Date(),
      shippingAddress: { /* address data */ },
      payment: { method: 'credit_card' }
    }
  ]
};

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

    console.log('Received token:', token);
    // Verify token and get user ID
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // In a real app, you would query your database here
    // This is just filtering mock data
    const userOrders = db.orders.filter(order => order.userId === userId);
    
    // Format dates to ISO strings
    const formattedOrders = userOrders.map(order => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt?.toISOString() || order.createdAt.toISOString()
    }));

    return NextResponse.json(formattedOrders);
    
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

    // Create new order
    const newOrder = {
      id: `order${db.orders.length + 1}`,
      userId,
      ...orderData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
 
    // In a real app, you would save to your database here
    db.orders.push(newOrder);

    return NextResponse.json(
      { 
        id: newOrder.id,
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