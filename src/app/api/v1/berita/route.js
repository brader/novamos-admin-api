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

    const title = formData.get('title');
    const body = formData.get('body');
    const category = formData.get('category') || '';
    const date = formData.get('date');
    const imageFile = formData.get('image');

    if (!title || !body || !date) {
      return NextResponse.json(
        { error: 'Title, body, and date are required' },
        { status: 400 }
      );
    }

    let imageUrl = '';
    
    // Handle berita image upload if exists
    if (imageFile && typeof imageFile !== 'string') {
      const bucket = storage.bucket('novamosapp.firebasestorage.app');
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const fileBuffer = await imageFile.arrayBuffer();

      const fileRef = bucket.file(`berita/${fileName}`);
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
      imageUrl = `https://storage.googleapis.com/${bucket.name}/berita/${fileName}`;
    }

    const beritaRef = await db.collection('berita').add({
      title,
      body,
      category,
      date: new Date(date).toISOString(),
      image: imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: beritaRef.id,
      message: 'Berita created successfully',
      image: imageUrl,
    });
  } catch (error) {
    console.error('Error creating berita:', error);
    return NextResponse.json(
      { error: 'Failed to create berita' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection('berita').get();

    const beritas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamp to ISO string if needed
      date: doc.data().date?.toDate?.()?.toISOString?.() || doc.data().date,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || doc.data().updatedAt,
    }));

    return NextResponse.json(beritas);
  } catch (error) {
    console.error('Error fetching beritas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beritas' },
      { status: 500 }
    );
  }
}