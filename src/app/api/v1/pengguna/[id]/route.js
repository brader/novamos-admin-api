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
    const jsonData = await request.json(); // Parse JSON body

    const { name, email, phone, role } = jsonData;

    const userRef = db.collection('pengguna').doc(id);
    
    await userRef.update({
      name,
      email,
      phone: phone || '',
      role: role || 'user',
      updatedAt: new Date().toISOString()
    });
    
    const updatedUser = await userRef.get();
    
    return NextResponse.json({
      id: updatedUser.id,
      ...updatedUser.data()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await db.collection('pengguna').doc(id).delete();
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}