import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../firebase/configure";

export async function POST(request) {
  try {
    console.log('Creating test order...');
    
    const testOrder = {
      id: 'test-order-123',
      userId: 'test-user',
      items: [
        {
          id: 'item1',
          name: 'Test Product',
          price: 10000,
          quantity: 1
        }
      ],
      totalAmount: 10000,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: 'transfer',
      transferReceipt: null
    };

    // Add to Firestore
    await db.collection("pesanan").doc(testOrder.id).set(testOrder);

    console.log('Test order created successfully');

    return NextResponse.json(
      {
        success: true,
        message: "Test order created successfully",
        orderId: testOrder.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating test order:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to create test order" 
      },
      { status: 500 }
    );
  }
}
