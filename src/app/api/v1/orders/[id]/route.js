import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const orderDoc = await db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: orderDoc.id,
      ...orderDoc.data()
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updateData = await request.json();

    await db.collection('orders').doc(id).update({
      ...updateData,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json(
      { message: 'Order updated successfully' }
    );

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await db.collection('orders').doc(id).delete();

    return NextResponse.json(
      { message: 'Order deleted successfully' }
    );

  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}