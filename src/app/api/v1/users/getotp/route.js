import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

export async function POST(request) {
  try {
    const { otp, uniq, phone } = await request.json();

    // Verify OTP exists and matches
    const otpDoc = await db.collection('otps').doc(uniq).get();
    
    if (!otpDoc.exists || otpDoc.data().otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 401 }
      );
    }

    // Check OTP expiration
    const expiresAt = new Date(otpDoc.data().expiresAt);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired' },
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
        { error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    const user = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id;

    // Generate Firebase auth token
    const token = await admin.auth().createCustomToken(userId);

    // Mark OTP as used
    await db.collection('otps').doc(uniq).update({ verified: true });

    return NextResponse.json({
      status: 'success',
      data: {
        accessToken: token,
        user: {
          id: userId,
          ...user
        }
      }
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}