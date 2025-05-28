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
    const email = formData.get('email');
    const phone = formData.get('phone') || '';
    const role = formData.get('role') || 'user';
    const profileFile = formData.get('profile');

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    let profileUrl = '';
    
    // Handle profile image upload if exists
    if (profileFile && typeof profileFile !== 'string') {
      const bucket = storage.bucket('novamosapp.firebasestorage.app');
      const fileExtension = profileFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const fileBuffer = await profileFile.arrayBuffer();

      const fileRef = bucket.file(`profiles/${fileName}`);
      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: profileFile.type,
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
      profileUrl = `https://storage.googleapis.com/${bucket.name}/profiles/${fileName}`;
    }

    const userRef = await db.collection('pengguna').add({
      name,
      email,
      phone,
      role,
      profile: profileUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: userRef.id,
      message: 'User created successfully',
      profile: profileUrl,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection('pengguna').get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}