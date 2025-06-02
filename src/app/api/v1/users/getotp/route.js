import { sendMessage } from '@/app/utils';
import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';

// Helper functions
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
}

function generateUniqueId(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request) {
  try {
    const { phone } = await request.json();
    
    // Validate phone number (basic validation)
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Valid phone number required' },
        { status: 400 }
      );
    }

    const otp = generateOTP();
    const uniq = generateUniqueId();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    // Save to Firestore
    await db.collection('otps').doc(uniq).set({
      otp,
      phone,
      expiresAt,
      createdAt: new Date().toISOString()
    });

    // In production, implement your SMS service (Twilio, etc.)
    await sendMessage(`62${phone}`, `Kode OTP anda : ${otp}`);
    console.log(`OTP for ${phone}: ${otp}`); // For development only

    return NextResponse.json(
      { 
        message: 'OTP sent successfully',
        data: { uniq } 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error generating OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}