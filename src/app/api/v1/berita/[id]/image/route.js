import { db, storage } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Get the file from FormData
    const formData = await request.formData();
    const beritaImageFile = formData.get('image');

    if (!beritaImageFile) {
      return NextResponse.json(
        { error: 'Berita image is required' },
        { status: 400 }
      );
    }

    // Initialize Firebase Storage
    const bucket = storage.bucket('novamosapp.firebasestorage.app');
    
    // Generate unique filename
    const fileExtension = beritaImageFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Convert file to buffer
    const fileBuffer = await beritaImageFile.arrayBuffer();
    
    // Upload to Firebase Storage
    const fileRef = bucket.file(`berita/${fileName}`);
    await fileRef.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: beritaImageFile.type,
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/berita/${fileName}`;

    // Update berita document in Firestore
    const beritaRef = db.collection('berita').doc(id);
    await beritaRef.update({
      image: imageUrl,
      updatedAt: new Date().toISOString()
    });

    // Get updated berita data
    const updatedBerita = await beritaRef.get();

    return NextResponse.json({
      id: updatedBerita.id,
      image: imageUrl,
      ...updatedBerita.data(),
      // Convert Firestore timestamp to ISO string if needed
      date: updatedBerita.data().date?.toDate?.()?.toISOString?.() || updatedBerita.data().date,
      updatedAt: updatedBerita.data().updatedAt?.toDate?.()?.toISOString?.() || updatedBerita.data().updatedAt
    });

  } catch (error) {
    console.error('Error updating berita image:', error);
    return NextResponse.json(
      { error: 'Failed to update berita image' },
      { status: 500 }
    );
  }
}