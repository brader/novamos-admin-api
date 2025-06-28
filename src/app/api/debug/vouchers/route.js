import { NextResponse } from "next/server";
import { db } from "@/firebase/configure";

// Temporary debug route to check voucher configurations
export async function GET() {
  try {
    const vouchersSnapshot = await db
      .collection("vouchers")
      .limit(10)
      .get();

    const vouchers = vouchersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        value: data.value,
        valueType: typeof data.value,
        min: data.min,
        minType: typeof data.min,
        type: data.type,
      };
    });

    return NextResponse.json({
      message: "Debug: Voucher configurations",
      vouchers,
    });
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}
