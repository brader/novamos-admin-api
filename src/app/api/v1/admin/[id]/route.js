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
      username, 
      password, 
      question, 
      answer,
      image // This should be the image URL if not changing, or base64 string if updating
    } = await request.json();

    if (!username || !question || !answer) {
      return NextResponse.json(
        { error: 'Username, security question and answer are required' },
        { status: 400 }
      );
    }

    const adminRef = db.collection('admin').doc(id);
    const updateData = {
      username,
      question,
      answer,
      updatedAt: new Date().toISOString()
    };

    // Only update password if provided
    if (password) {
      updateData.password = password; // Note: Should hash password in production
    }

    // Handle image update if provided (as base64 string)
    if (image && image.startsWith('data:image')) {
      const bucket = storage.bucket('novamosapp.firebasestorage.app');
      const fileExtension = image.split(';')[0].split('/')[1];
      const fileName = `${uuidv4()}.${fileExtension}`;
      
      // Remove the base64 prefix
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');

      // Upload to Firebase Storage
      const fileRef = bucket.file(`admin/${fileName}`);
      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: `image/${fileExtension}`,
        },
      });

      // Make file publicly accessible
      await fileRef.makePublic();
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/admin/${fileName}`;
      updateData.image = imageUrl;
    } else if (image) {
      // If it's just a URL, keep it as is
      updateData.image = image;
    }

    await adminRef.update(updateData);
    const updatedAdmin = await adminRef.get();

    // Don't return sensitive data
    const responseData = {
      id: updatedAdmin.id,
      username: updatedAdmin.data().username,
      image: updatedAdmin.data().image,
      question: updatedAdmin.data().question,
      updatedAt: updatedAdmin.data().updatedAt?.toDate?.()?.toISOString?.() || updatedAdmin.data().updatedAt
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Optional: Delete the associated image from storage
    const adminDoc = await db.collection('admin').doc(id).get();
    if (adminDoc.exists && adminDoc.data().image) {
      const imageUrl = adminDoc.data().image;
      // Extract path from URL and delete from storage
      // Implementation depends on your storage setup
    }
    
    await db.collection('admin').doc(id).delete();
    
    return NextResponse.json({ 
      message: 'Admin deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}