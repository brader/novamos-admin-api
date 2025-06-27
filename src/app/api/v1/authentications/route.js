import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';

export async function POST(request) {
  try {
    const { otp, uniq, phone } = await request.json();

    // Verify OTP
    const otpDoc = await db.collection('otps').doc(uniq).get();

    if (!otpDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    const otpData = otpDoc.data();
    const storedOtp = otpData.otp;
    const expiresAt = otpData.expiresAt;

    // Check if OTP has expired - handle both Date object and ISO string
    let isExpired = false;
    if (expiresAt) {
      const expirationTime = typeof expiresAt === 'string' ? new Date(expiresAt) : 
                            (expiresAt.toDate ? expiresAt.toDate() : expiresAt);
      isExpired = new Date() > expirationTime;
    }

    if (isExpired) {
      await db.collection('otps').doc(uniq).delete(); // Clean up expired OTP
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 401 }
      );
    }

    if (String(storedOtp) !== String(otp)) {
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

export async function PUT(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Get user data
    const userDoc = await db.collection('pengguna').doc(decoded.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId, phone: userData.phone },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return NextResponse.json({
      status: 'success',
      data: {
        accessToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed', details: error.message },
      { status: 500 }
    );
  }
}