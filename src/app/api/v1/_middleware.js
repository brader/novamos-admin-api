import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function middleware(request) {
  // Skip middleware for OTP requests
  if (request.method === 'POST' && request.nextUrl.pathname === '/api/users') {
    return NextResponse.next();
  }

  const token = request.headers.get('authorization')?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authorization token required' },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const response = NextResponse.next();
    response.headers.set('x-user-id', decoded.userId);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: '/api/users',
};