import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { otp, uniq, phone } = await request.json();
    console.log('Received request with:', { otp, uniq, phone });

    // Verify OTP
    const otpDoc = await db.collection('otps').doc(uniq).get();
    console.log('Firebase OTP document:', otpDoc.exists ? otpDoc.data() : 'NOT FOUND');

    if (!otpDoc.exists) {
      console.log('OTP document not found for uniq:', uniq);
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }

    const storedOtp = otpDoc.data().otp;
    console.log('Stored OTP:', storedOtp, 'Type:', typeof storedOtp);
    console.log('Received OTP:', otp, 'Type:', typeof otp);

    if (String(storedOtp) !== String(otp)) {
      console.log('OTP mismatch:', {
        stored: storedOtp,
        received: otp,
        storedType: typeof storedOtp,
        receivedType: typeof otp
      });
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

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Extract required user fields
    const user = {
      id: userDoc.id,
      email: userData.email || '',
      phone: userData.phone || '',
      name: userData.name || '',
      profile: userData.profile || '' // assuming profile might be a URL or object
    };

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone },
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
        email: user.email,
        phone: user.phone,
        name: user.name,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}