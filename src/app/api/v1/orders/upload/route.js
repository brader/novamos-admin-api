import { NextRequest, NextResponse } from "next/server";
import { db, storage } from "../../../../../firebase/configure";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const orderId = formData.get("orderId");

    console.log('Upload request received:', { orderId, hasImage: !!image });

    if (!image || !orderId) {
      console.error('Missing required fields:', { image: !!image, orderId });
      return NextResponse.json(
        { 
          success: false,
          error: "Image and order ID are required" 
        },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const filename = `transfer-receipts/${orderId}/${uuidv4()}.jpg`;

    console.log('Uploading to Firebase Storage:', filename);

    // Check if order exists before uploading
    const orderRef = db.collection("pesanan").doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      console.error('Order not found:', orderId);
      return NextResponse.json(
        { 
          success: false,
          error: "Order not found" 
        },
        { status: 404 }
      );
    }

    // Upload to Firebase Storage
    const file = storage.bucket().file(filename);
    await file.save(buffer, {
      metadata: {
        contentType: image.type,
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${filename}`;

    console.log('File uploaded successfully:', publicUrl);

    // Update order with transfer receipt URL
    await orderRef.update({
      transferReceipt: publicUrl,
      updatedAt: new Date().toISOString(),
    });

    console.log('Order updated successfully');

    return NextResponse.json(
      {
        success: true,
        message: "Transfer receipt uploaded successfully",
        url: publicUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading transfer receipt:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to upload transfer receipt" 
      },
      { status: 500 }
    );
  }
}
