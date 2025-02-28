// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Import firebaseAdmin conditionally to prevent errors if it's not set up yet
let admin: any;
try {
  admin = require('./firebaseAdmin');
} catch (error) {
  console.warn('Firebase admin not initialized. Middleware in development mode.');
}

// Map paths to required roles
const rolePathMap: Record<string, string[]> = {
  '/admin': ['admin'],
  '/sales-manager': ['admin', 'sales_manager'],
  '/telemarketer': ['admin', 'sales_manager', 'telemarketer'],
  '/counselor': ['admin', 'counselor'],
  '/student': ['admin', 'counselor', 'student']
};

export async function middleware(request: NextRequest) {
  // DEVELOPMENT MODE OVERRIDE
  // During development, bypass authentication to access routes directly
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    console.log('Development mode: Bypassing authentication middleware');
    return NextResponse.next();
  }

  // PRODUCTION AUTHENTICATION LOGIC
  // Check if user is authenticated
  try {
    const session = request.cookies.get('session')?.value || '';
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify the session cookie
    const decodedClaims = await admin.auth().verifySessionCookie(session, true);
    if (!decodedClaims) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get the user document from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedClaims.uid)
      .get();
    
    if (!userDoc.exists) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const userData = userDoc.data();
    const userRole = userData?.role;

    // Check if user has permission to access the path
    const path = request.nextUrl.pathname;
    
    // Find which section the user is trying to access
    const section = Object.keys(rolePathMap).find(key => path.startsWith(key));
    
    if (section) {
      const allowedRoles = rolePathMap[section];
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // In case of errors in development, still allow access
    if (isDevelopment) {
      return NextResponse.next();
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/sales-manager/:path*',
    '/telemarketer/:path*',
    '/counselor/:path*',
    '/student/:path*',
  ],
};