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
    
    console.log("Auth header:", authHeader);
    
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';
        const token = authHeader.split(" ")[1];
        
        console.log("Token to verify:", token?.substring(0, 50) + "...");
        console.log("JWT_SECRET length:", JWT_SECRET.length);
        
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("Decoded JWT payload:", JSON.stringify(decoded, null, 2));
        userId = decoded?.userId;
        
        console.log("JWT decoded successfully:", { userId, phone: decoded?.phone });
      } catch (error) {
        console.log("JWT verification failed:", error.message);
        console.log("JWT error name:", error.name);
      }
    } else {
      console.log("No Bearer token found in auth header");
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
      console.log("Querying orders for userId:", userId);
      
      // Try both userId field and user.id field to handle different data structures
      const ordersSnapshot1 = await db
        .collection("pesanan")
        .where("userId", "==", userId)
        .get();
        
      const ordersSnapshot2 = await db
        .collection("pesanan")
        .where("user.id", "==", userId)
        .get();
        
      // Combine results and remove duplicates
      const allDocs = [...ordersSnapshot1.docs, ...ordersSnapshot2.docs];
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      );
      
      console.log("Found orders:", uniqueDocs.length);

      const orders = uniqueDocs
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
