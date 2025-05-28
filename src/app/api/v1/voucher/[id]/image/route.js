import { db, storage } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Get the file from FormData
    const formData = await request.formData();
    const voucherImageFile = formData.get('image');

    if (!voucherImageFile) {
      return NextResponse.json(
        { error: 'Voucher image is required' },
        { status: 400 }
      );
    }

    // Initialize Firebase Storage
    const bucket = storage.bucket('novamosapp.firebasestorage.app');
    
    // Generate unique filename
    const fileExtension = voucherImageFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Convert file to buffer
    const fileBuffer = await voucherImageFile.arrayBuffer();
    
    // Upload to Firebase Storage
    const fileRef = bucket.file(`vouchers/${fileName}`);
    await fileRef.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: voucherImageFile.type,
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/vouchers/${fileName}`;

    // Update voucher document in Firestore
    const voucherRef = db.collection('vouchers').doc(id);
    await voucherRef.update({
      image: imageUrl,
      updatedAt: new Date().toISOString()
    });

    // Get updated voucher data
    const updatedVoucher = await voucherRef.get();

    return NextResponse.json({
      id: updatedVoucher.id,
      image: imageUrl,
      ...updatedVoucher.data(),
      // Convert Firestore timestamp to ISO string if needed
      expired: updatedVoucher.data().expired?.toDate?.()?.toISOString?.() || updatedVoucher.data().expired,
      updatedAt: updatedVoucher.data().updatedAt?.toDate?.()?.toISOString?.() || updatedVoucher.data().updatedAt
    });

  } catch (error) {
    console.error('Error updating voucher image:', error);
    return NextResponse.json(
      { error: 'Failed to update voucher image' },
      { status: 500 }
    );
  }
}