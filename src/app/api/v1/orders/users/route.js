import { NextResponse } from "next/server";
import { db } from "@/firebase/configure";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    // 1. Authorization check
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 2. Query with error handling for index issues
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
