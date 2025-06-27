import { db, storage } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import jwt from 'jsonwebtoken';

// Helper functions
function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

function generateOTP() {
  return Math.floor(Math.random() * 9000) + 1000;
}

function generateUniqueId(length = 16) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

// JWT secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Check if this is an OTP request or user registration
    const action = formData.get('action');
    
    if (action === 'request-otp') {
      // Handle OTP request
      const phone = formData.get('phone');
      if (!phone) {
        return NextResponse.json(
          { error: 'Phone number is required' },
          { status: 400 }
        );
      }

      const otp = generateOTP();
      const uniq = generateUniqueId();
      
      // Store OTP in Firestore
      await db.collection('otps').doc(uniq).set({
        otp: Number(otp), // Store as number
        phone,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // Store as ISO string
      });

      // Send OTP (implement your SMS service)
      await sendMessage(`62${phone}`, `Kode OTP anda : ${otp}`);

      return NextResponse.json({
        message: "OTP sent successfully",
        data: { uniq }
      }, { status: 201 });

    } else if (action === 'register') {
      // Handle user registration
      const { otp, uniq, name, email, phone } = Object.fromEntries(formData);
      
      // Validate required fields
      if (!name || !phone) {
        return NextResponse.json(
          { error: 'Name and phone number are required' },
          { status: 400 }
        );
      }

      // Verify OTP
      const otpDoc = await db.collection('otps').doc(uniq).get();
      if (!otpDoc.exists) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 400 }
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
          { status: 400 }
        );
      }

      // Convert both to strings for comparison
      if (String(storedOtp) !== String(otp)) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        );
      }

      // Check if user already exists by phone number
      const userSnapshot = await db.collection('pengguna')
        .where('phone', '==', phone)
        .limit(1)
        .get();

      if (!userSnapshot.empty) {
        return NextResponse.json(
          { error: 'User with this phone number already exists' },
          { status: 400 }
        );
      }

      // If email is provided, validate it's not already in use
      if (email && email.trim()) {
        const emailSnapshot = await db.collection('pengguna')
          .where('email', '==', email.trim())
          .limit(1)
          .get();

        if (!emailSnapshot.empty) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 400 }
          );
        }
      }

      // Handle profile image upload if exists
      const profileFile = formData.get('profile');
      let profileUrl = '';
      
      if (profileFile && typeof profileFile !== 'string') {
        const bucket = storage.bucket('novamosapp.firebasestorage.app');
        const fileExtension = profileFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const fileBuffer = await profileFile.arrayBuffer();

        const fileRef = bucket.file(`profiles/${fileName}`);
        const stream = fileRef.createWriteStream({
          metadata: {
            contentType: profileFile.type,
          },
          resumable: false,
        });

        await new Promise((resolve, reject) => {
          bufferToStream(Buffer.from(fileBuffer))
            .pipe(stream)
            .on('error', reject)
            .on('finish', resolve);
        });

        await fileRef.makePublic();
        profileUrl = `https://storage.googleapis.com/${bucket.name}/profiles/${fileName}`;
      }

      // Create user
      const userRef = await db.collection('pengguna').add({
        name,
        email: email && email.trim() ? email.trim() : '', // Optional email
        phone,
        role: 'user',
        profile: profileUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Generate JWT token - use phone instead of email as identifier
      const token = jwt.sign(
        { userId: userRef.id, phone, role: 'user' },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Delete used OTP
      await db.collection('otps').doc(uniq).delete();

      return NextResponse.json({
        message: 'User registered successfully',
        data: {
          userId: userRef.id,
          token
        }
      }, { status: 201 });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in user registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Verify JWT token
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data
    const userDoc = await db.collection('pengguna').doc(decoded.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          id: userDoc.id,
          ...userDoc.data()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 