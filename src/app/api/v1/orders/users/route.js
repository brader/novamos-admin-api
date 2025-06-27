import { NextResponse } from "next/server";
import { db } from "@/firebase/configure";

export async function GET(request) {
  try {
    // Get userId from query parameters as fallback
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    // 1. Try to get userId from Authorization header first
    let userId = null;
    const authHeader = request.headers.get("authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET;
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.userId;
      } catch (error) {
        console.log("JWT verification failed, trying query param");
      }
    }
    
    // If no userId from JWT, try query parameter
    if (!userId && userIdParam) {
      userId = userIdParam;
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter or invalid token" },
        { status: 400 }
      );
    }

    // 2. Query orders by userId
    try {
      const ordersSnapshot = await db
        .collection("pesanan")
        .where("userId", "==", userId)
        .get();

      const orders = ordersSnapshot.docs
        .map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            ...data,
            updatedAt:
              data.updatedAt && typeof data.updatedAt.toDate === "function"
                ? data.updatedAt.toDate().toISOString()
                : null,
          };
        })
        .sort((a, b) => {
          // Optional: sort by updatedAt descending (newest first)
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });

      return NextResponse.json(orders);
    } catch (queryError) {
      console.error("Firestore query error:", queryError);

      if (queryError.code === 9) {
        // FAILED_PRECONDITION
        return NextResponse.json(
          {
            error: "Server configuration issue",
            details: "The query requires an index to be created",
            fix: queryError.details, // Contains the direct link
          },
          { status: 500 }
        );
      }

      throw queryError; // Re-throw other errors
    }
  } catch (error) {
    console.error("Error in orders endpoint:", error);

    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      },
      { status: 500 }
    );
  }
}
