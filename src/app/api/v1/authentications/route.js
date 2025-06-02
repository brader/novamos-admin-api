import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { otp, uniq, phone } = await request.json();

    // Verify OTP
    const otpDoc = await db.collection('otps').doc(uniq).get();
    if (!otpDoc.exists || otpDoc.data().otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }

    // Find user by phone
    const userSnapshot = await db.collection('pengguna')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };
    
    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, phone },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Delete used OTP
    await db.collection('otps').doc(uniq).delete();

    return NextResponse.json({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
        user
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}