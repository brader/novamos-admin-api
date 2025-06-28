import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../firebase/configure";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    console.log('Debug: Fetching orders with transfer receipts...');
    
    // Get orders that have transfer receipts
    const ordersSnapshot = await db.collection("pesanan")
      .where('transferReceipt', '!=', null)
      .limit(limit)
      .get();
    
    const ordersWithReceipts = [];
    ordersSnapshot.forEach(doc => {
      const order = { id: doc.id, ...doc.data() };
      ordersWithReceipts.push({
        id: order.id,
        transferReceipt: order.transferReceipt,
        paymentMethod: order.payment?.method,
        userId: order.userId || order.user?.id,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      });
    });

    console.log(`Debug: Found ${ordersWithReceipts.length} orders with transfer receipts`);
    
    return NextResponse.json({
      success: true,
      count: ordersWithReceipts.length,
      orders: ordersWithReceipts
    });
  } catch (error) {
    console.error("Error fetching orders with receipts:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch orders" 
      },
      { status: 500 }
    );
  }
}
