import { db, storage } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Get the file from FormData
    const formData = await request.formData();
    const profileFile = formData.get('profile');

    if (!profileFile) {
      return NextResponse.json(
        { error: 'Profile image is required' },
        { status: 400 }
      );
    }

    // Initialize Firebase Storage
    const bucket = storage.bucket('novamosapp.firebasestorage.app');
    
    // Generate unique filename
    const fileExtension = profileFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Convert file to buffer
    const fileBuffer = await profileFile.arrayBuffer();
    
    // Upload to Firebase Storage
    const fileRef = bucket.file(`profiles/${fileName}`);
    await fileRef.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: profileFile.type,
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();
    const profileUrl = `https://storage.googleapis.com/${bucket.name}/profiles/${fileName}`;

    // Update user document in Firestore
    const userRef = db.collection('pengguna').doc(id);
    await userRef.update({
      profile: profileUrl,
      updatedAt: new Date().toISOString()
    });

    // Get updated user data
    const updatedUser = await userRef.get();

    return NextResponse.json({
      id: updatedUser.id,
      profile: profileUrl,
      ...updatedUser.data()
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile picture' },
      { status: 500 }
    );
  }
}