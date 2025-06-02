import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { otp, uniq, name, email, phone } = await request.json();

    // Basic validation
    if (!otp || !uniq || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify OTP from Firestore
    const otpDoc = await db.collection('otps').doc(uniq).get();
    
    if (!otpDoc.exists || otpDoc.data().otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const userSnapshot = await db.collection('pengguna')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const userRef = await db.collection('pengguna').add({
      name,
      email,
      phone,
      role: 'user', // Default role
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Get the created user data
    const userDoc = await userRef.get();
    const user = { id: userDoc.id, ...userDoc.data() };

    // Delete used OTP
    await db.collection('otps').doc(uniq).delete();

    return NextResponse.json(
      {
        status: 'success',
        message: 'User registered successfully',
        data: { user }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}