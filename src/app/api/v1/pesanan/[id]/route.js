import { db } from "@/firebase/configure";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
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

    // Handle full order edit if data contains more than just status/awb
    if (data.user || data.address || data.courier || data.items) {
      // Validate required fields for full order update
      if (!data.user || !data.address || !data.items || !data.courier) {
        return NextResponse.json(
          { error: 'Missing required fields for order update' },
          { status: 400 }
        );
      }

      // Prepare the complete order update
      updates.user = typeof data.user === 'string' ? data.user : JSON.stringify(data.user);
      updates.address = typeof data.address === 'string' ? data.address : JSON.stringify(data.address);
      updates.items = typeof data.items === 'string' ? data.items : JSON.stringify(data.items);
      updates.courier = typeof data.courier === 'string' ? data.courier : JSON.stringify({
        ...(typeof existingOrder.courier === 'string' ? JSON.parse(existingOrder.courier) : existingOrder.courier),
        ...data.courier,
        awb: data.courier.awb || (typeof existingOrder.courier === 'string' 
          ? JSON.parse(existingOrder.courier).awb 
          : existingOrder.courier?.awb)
      });
      
      // Recalculate totals if items changed
      if (data.items) {
        const items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const shippingCost = data.courier?.price || 
          (typeof existingOrder.courier === 'string' 
            ? JSON.parse(existingOrder.courier).price 
            : existingOrder.courier?.price) || 0;
        
        updates.subtotal = subtotal;
        updates.total = subtotal + shippingCost;
      }
    }

    // Update AWB if provided (standalone or as part of courier update)
    if (data.awbNumber || (data.courier && data.courier.awb)) {
      const awb = data.awbNumber || data.courier.awb;
      const existingCourier = typeof existingOrder.courier === 'string' 
        ? JSON.parse(existingOrder.courier) 
        : existingOrder.courier;
      
      updates.courier = JSON.stringify({
        ...existingCourier,
        awb: awb
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
    const responseData = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      message: 'Order updated successfully'
    };

    // Parse any stringified fields for the response
    if (typeof responseData.user === 'string') responseData.user = JSON.parse(responseData.user);
    if (typeof responseData.address === 'string') responseData.address = JSON.parse(responseData.address);
    if (typeof responseData.items === 'string') responseData.items = JSON.parse(responseData.items);
    if (typeof responseData.courier === 'string') responseData.courier = JSON.parse(responseData.courier);
    if (typeof responseData.status === 'string') responseData.status = JSON.parse(responseData.status);

    return NextResponse.json(responseData);

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

    await orderRef.delete();

    return NextResponse.json({
      id: id,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}