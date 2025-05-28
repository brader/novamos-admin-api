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

export async function POST(request) {
  try {
    const formData = await request.formData();

    const name = formData.get('name');
    const description = formData.get('description');
    const type = formData.get('type') || 'ongkir';
    const value = Number(formData.get('value')) || 0;
    const min = Number(formData.get('min')) || 0;
    const expired = formData.get('expired');
    const imageFile = formData.get('image');

    if (!name || !description || !expired) {
      return NextResponse.json(
        { error: 'Name, description, and expiration date are required' },
        { status: 400 }
      );
    }

    let imageUrl = '';
    
    // Handle voucher image upload if exists
    if (imageFile && typeof imageFile !== 'string') {
      const bucket = storage.bucket('novamosapp.firebasestorage.app');
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const fileBuffer = await imageFile.arrayBuffer();

      const fileRef = bucket.file(`vouchers/${fileName}`);
      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: imageFile.type,
        },
        resumable: false,
      });

      await new Promise((resolve, reject) => {
        bufferToStream(Buffer.from(fileBuffer))
          .pipe(stream)
          .on('error', reject)
          .on('finish', resolve);
      });

      // Make file public and get URL
      await fileRef.makePublic();
      imageUrl = `https://storage.googleapis.com/${bucket.name}/vouchers/${fileName}`;
    }

    const voucherRef = await db.collection('vouchers').add({
      name,
      description,
      type,
      value,
      min,
      expired: new Date(expired).toISOString(),
      image: imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: voucherRef.id,
      message: 'Voucher created successfully',
      image: imageUrl,
    });
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection('vouchers').get();

    const vouchers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamp to ISO string if needed
      expired: doc.data().expired?.toDate?.()?.toISOString?.() || doc.data().expired,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || doc.data().updatedAt,
    }));

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}