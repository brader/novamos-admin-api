import { db } from "@/firebase/configure";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    // Properly destructure params after awaiting
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderRef = db.collection('pesanan').doc(id);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const existingOrder = orderDoc.data();
    
    // Prepare updates
    const updates = {
      updated_at: new Date().toISOString()
    };

    // Update AWB if provided
    if (data.awbNumber) {
      const existingCourier = typeof existingOrder.courier === 'string' 
        ? JSON.parse(existingOrder.courier) 
        : existingOrder.courier;
      
      updates.courier = JSON.stringify({
        ...existingCourier,
        awb: data.awbNumber
      });
    }

    // Update status if provided
    if (data.status) {
      const existingStatus = typeof existingOrder.status === 'string'
        ? JSON.parse(existingOrder.status)
        : existingOrder.status;

      const updatedStatus = existingStatus.map(step => {
        if (step.title === data.status) {
          return {
            ...step,
            status: true,
            date: step.date || new Date().toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'long',
              year: 'numeric'
            })
          };
        }
        return step;
      });
      
      updates.status = JSON.stringify(updatedStatus);
    }

    await orderRef.update(updates);

    // Return the updated order
    const updatedDoc = await orderRef.get();
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}