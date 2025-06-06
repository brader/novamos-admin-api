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
      title, 
      body, 
      category = '', 
      date,
      image // This should be the image URL if not changing, or base64 string if updating
    } = await request.json();

    if (!title || !body || !date) {
      return NextResponse.json(
        { error: 'Title, body, and date are required' },
        { status: 400 }
      );
    }

    const beritaRef = db.collection('berita').doc(id);
    const updateData = {
      title,
      body,
      category,
      date: new Date(date).toISOString(),
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
      const fileRef = bucket.file(`berita/${fileName}`);
      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: `image/${fileExtension}`,
        },
      });

      // Make file publicly accessible
      await fileRef.makePublic();
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/berita/${fileName}`;
      updateData.image = imageUrl;
    } else if (image) {
      // If it's just a URL, keep it as is
      updateData.image = image;
    }

    await beritaRef.update(updateData);
    const updatedBerita = await beritaRef.get();

    return NextResponse.json({
      id: updatedBerita.id,
      ...updatedBerita.data(),
      date: updatedBerita.data().date?.toDate?.()?.toISOString?.() || updatedBerita.data().date,
      updatedAt: updatedBerita.data().updatedAt?.toDate?.()?.toISOString?.() || updatedBerita.data().updatedAt
    });

  } catch (error) {
    console.error('Error updating berita:', error);
    return NextResponse.json(
      { error: 'Failed to update berita' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Optional: Delete the associated image from storage
    const beritaDoc = await db.collection('berita').doc(id).get();
    if (beritaDoc.exists && beritaDoc.data().image) {
      const imageUrl = beritaDoc.data().image;
      // Extract path from URL and delete from storage
      // Implementation depends on your storage setup
    }
    
    await db.collection('berita').doc(id).delete();
    
    return NextResponse.json({ 
      message: 'Berita deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting berita:', error);
    return NextResponse.json(
      { error: 'Failed to delete berita' },
      { status: 500 }
    );
  }
}

// This should be added to your backend API (but don't edit your existing backend as per your request)
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const docRef = db.collection('berita').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const article = {
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings
      date: doc.data().date?.toDate?.()?.toISOString?.(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.(),
    };

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}