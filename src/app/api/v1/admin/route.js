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

    const username = formData.get('username');
    const password = formData.get('password');
    const question = formData.get('question');
    const answer = formData.get('answer');
    const imageFile = formData.get('image');

    if (!username || !password || !question || !answer) {
      return NextResponse.json(
        { error: 'Username, password, security question and answer are required' },
        { status: 400 }
      );
    }

    let imageUrl = '';
    
    // Handle admin image upload if exists
    if (imageFile && typeof imageFile !== 'string') {
      const bucket = storage.bucket('novamosapp.firebasestorage.app');
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const fileBuffer = await imageFile.arrayBuffer();

      const fileRef = bucket.file(`admin/${fileName}`);
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
      imageUrl = `https://storage.googleapis.com/${bucket.name}/admin/${fileName}`;
    }

    const adminRef = await db.collection('admin').add({
      username,
      password, // Note: In production, you should hash the password before storing
      question,
      answer,
      image: imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: adminRef.id,
      message: 'Admin created successfully',
      image: imageUrl,
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection('admin').get();

    const admins = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username,
        question: data.question,
        image: data.image,
        // Don't return sensitive data like password and answer
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt,
      };
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}