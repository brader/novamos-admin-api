import { db, storage } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

// Helper: convert arrayBuffer to stream
function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {}; // _read is required but noop
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Parse JSON body
    const { 
      name, 
      description, 
      type = 'ongkir', 
      value = 0, 
      min = 0, 
      expired,
      image // This should be the image URL if not changing, or base64 string if updating
    } = await request.json();

    if (!name || !description || !expired) {
      return NextResponse.json(
        { error: 'Name, description, and expiration date are required' },
        { status: 400 }
      );
    }

    const voucherRef = db.collection('vouchers').doc(id);
    const updateData = {
      name,
      description,
      type,
      value: Number(value),
      min: Number(min),
      expired: new Date(expired).toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Handle image update if provided (as base64 string)
    if (image && image.startsWith('data:image')) {
      const bucket = storage.bucket('novamosapp.firebasestorage.app');
      const fileExtension = image.split(';')[0].split('/')[1];
      const fileName = `${uuidv4()}.${fileExtension}`;
      
      // Remove the base64 prefix
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');

      // Upload to Firebase Storage
      const fileRef = bucket.file(`vouchers/${fileName}`);
      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: `image/${fileExtension}`,
        },
      });

      // Make file publicly accessible
      await fileRef.makePublic();
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/vouchers/${fileName}`;
      updateData.image = imageUrl;
    } else if (image) {
      // If it's just a URL, keep it as is
      updateData.image = image;
    }

    await voucherRef.update(updateData);
    const updatedVoucher = await voucherRef.get();

    return NextResponse.json({
      id: updatedVoucher.id,
      ...updatedVoucher.data(),
      expired: updatedVoucher.data().expired?.toDate?.()?.toISOString?.() || updatedVoucher.data().expired,
      updatedAt: updatedVoucher.data().updatedAt?.toDate?.()?.toISOString?.() || updatedVoucher.data().updatedAt
    });

  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to update voucher' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const voucherDoc = await db.collection('vouchers').doc(id).get();
    if (voucherDoc.exists && voucherDoc.data().image) {
      const imageUrl = voucherDoc.data().image;
    }
    
    await db.collection('vouchers').doc(id).delete();
    
    return NextResponse.json({ 
      message: 'Voucher deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    return NextResponse.json(
      { error: 'Failed to delete voucher' },
      { status: 500 }
    );
  }
}