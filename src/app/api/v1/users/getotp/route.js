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
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes expiry

    // Save to Firestore with ISO string for expiration
    await db.collection('otps').doc(uniq).set({
      otp: Number(otp), // Ensure it's stored as a number
      phone,
      expiresAt: expiresAt.toISOString(), // Store as ISO string for easier comparison
      createdAt: now.toISOString()
    });

    // In production, implement your SMS service (Twilio, etc.)
    const message = `Kode OTP anda : ${otp}`;
    await sendMessage(`62${phone}`, message);

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