import { NextResponse } from "next/server";
import { db } from "../../../firebase/configure";

export async function GET() {
  try {
    const ordersSnapshot = await db.collection("orders").limit(5).get();
    
    const orders = [];
    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        voucher: data.voucher,
        total: data.total,
        courier: data.courier,
        items: data.items,
        // Include any other relevant fields
      });
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
