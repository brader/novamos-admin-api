import { NextResponse } from "next/server";
import { db } from "@/firebase/configure";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(_, { params }) {
  const { id } = params;

  try {
    // Get authorization header
    const authHeader = _.headers.get("authorization");
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.userId;
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid authentication token" },
          { status: 401 }
        );
      }
    }

    const docRef = db.collection("pesanan").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = docSnap.data();

    // If authenticated, verify the user can access this order
    if (userId && data.userId && data.userId !== userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

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
