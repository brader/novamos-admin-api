import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { username, password } = await request.json();

  try {
    const snapshot = await db.collection('admin')
      .where('username', '==', username)
      .where('password', '==', password)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Optional: Simulate token
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    return NextResponse.json({ success: true, token }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
