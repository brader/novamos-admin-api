import { db, storage } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Get the file from FormData
    const formData = await request.formData();
    const adminImageFile = formData.get('image');

    if (!adminImageFile) {
      return NextResponse.json(
        { error: 'Admin profile image is required' },
        { status: 400 }
      );
    }

    // Initialize Firebase Storage
    const bucket = storage.bucket('novamosapp.firebasestorage.app');
    
    // Generate unique filename
    const fileExtension = adminImageFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Convert file to buffer
    const fileBuffer = await adminImageFile.arrayBuffer();
    
    // Upload to Firebase Storage
    const fileRef = bucket.file(`admin-profiles/${fileName}`);
    await fileRef.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: adminImageFile.type,
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/admin-profiles/${fileName}`;

    // Update admin document in Firestore
    const adminRef = db.collection('admin').doc(id);
    await adminRef.update({
      image: imageUrl,
      updatedAt: new Date().toISOString()
    });

    // Get updated admin data (excluding sensitive information)
    const updatedAdmin = await adminRef.get();

    return NextResponse.json({
      id: updatedAdmin.id,
      image: imageUrl,
      username: updatedAdmin.data().username,
      updatedAt: updatedAdmin.data().updatedAt?.toDate?.()?.toISOString?.() || updatedAdmin.data().updatedAt
    });

  } catch (error) {
    console.error('Error updating admin profile image:', error);
    return NextResponse.json(
      { error: 'Failed to update admin profile image' },
      { status: 500 }
    );
  }
}