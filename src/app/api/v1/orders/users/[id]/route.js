import { NextResponse } from "next/server";
import { db } from "@/firebase/configure";

export async function GET(_, { params }) {
  const { id } = params;

  try {
    const docRef = db.collection("pesanan").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = docSnap.data();

    return NextResponse.json({
      order: {
        id: docSnap.id,
        ...data,
        updatedAt:
          data.updatedAt && typeof data.updatedAt.toDate === "function"
            ? data.updatedAt.toDate().toISOString()
            : null,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
