import { NextRequest, NextResponse } from "next/server";
import { db, storage } from "../../../../../firebase/configure";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    console.log('Base64 upload request received');
    
    const body = await request.json();
    const { imageBase64, orderId } = body;

    console.log('Upload request received:', { orderId, hasImage: !!imageBase64 });

    if (!imageBase64 || !orderId) {
      console.error('Missing required fields:', { hasImage: !!imageBase64, orderId });
      return NextResponse.json(
        { 
          success: false,
          error: "Image (base64) and order ID are required" 
        },
        { status: 400 }
      );
    }

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

    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const filename = `transfer-receipts/${orderId}/${uuidv4()}.jpg`;

    console.log('Uploading to Firebase Storage:', filename);

    // Upload to Firebase Storage
    const file = storage.bucket().file(filename);
    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
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
