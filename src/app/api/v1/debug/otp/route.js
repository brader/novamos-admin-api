import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uniq = searchParams.get('uniq');
    
    if (!uniq) {
      return NextResponse.json(
        { error: 'uniq parameter required' },
        { status: 400 }
      );
    }

    // Get OTP data for debugging
    const otpDoc = await db.collection('otps').doc(uniq).get();
    
    if (!otpDoc.exists) {
      return NextResponse.json(
        { error: 'OTP not found' },
        { status: 404 }
      );
    }

    const otpData = otpDoc.data();
    
    // Check expiration
    let isExpired = false;
    let expirationInfo = {};
    
    if (otpData.expiresAt) {
      const expirationTime = typeof otpData.expiresAt === 'string' ? 
        new Date(otpData.expiresAt) : 
        (otpData.expiresAt.toDate ? otpData.expiresAt.toDate() : otpData.expiresAt);
      
      const now = new Date();
      isExpired = now > expirationTime;
      
      expirationInfo = {
        expiresAt: expirationTime.toISOString(),
        currentTime: now.toISOString(),
        isExpired,
        timeLeft: isExpired ? 0 : Math.round((expirationTime - now) / 1000) // seconds
      };
    }

    return NextResponse.json({
      status: 'success',
      data: {
        uniq,
        otp: otpData.otp,
        otpType: typeof otpData.otp,
        phone: otpData.phone,
        createdAt: otpData.createdAt,
        expiration: expirationInfo
      }
    });

  } catch (error) {
    console.error('Debug OTP error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 }
    );
  }
}
