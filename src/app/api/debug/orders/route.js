import { NextResponse } from "next/server";
import { db } from "@/firebase/configure";

// Temporary debug route to check voucher data in orders
export async function GET() {
  try {
    const ordersSnapshot = await db
      .collection("pesanan")
      .limit(5)
      .orderBy("createdAt", "desc")
      .get();

    const orders = ordersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        voucher: data.voucher,
        subtotal: data.subtotal,
        total: data.total,
        createdAt: data.createdAt,
      };
    });

    return NextResponse.json({
      message: "Debug: Recent orders with voucher data",
      orders,
    });
  } catch (error) {
    console.error("Error fetching debug data:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug data" },
      { status: 500 }
    );
  }
}
