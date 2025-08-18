import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return json({ error: 'Both email and password are required to log in. Please fill in all fields.' }, { status: 400 });
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      return json({ error: 'No account found with this email address. Please check your email or sign up for a new account.' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password || '');
    if (!isValidPassword) {
      return json({ error: 'The password you entered is incorrect. Please try again or reset your password if you have forgotten it.' }, { status: 401 });
    }

    // Check if user has the expected role (if role parameter is provided)
    if (role && user.role !== role) {
      return json({ error: `Access denied. This login is restricted to ${role} users only. Please ensure you are using the correct login portal.` }, { status: 403 });
    }

    // Create a simple session token (for demo purposes)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    // Set session cookie
    cookies.set('session_token', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    // Store user info in cookie for session management
    cookies.set('user_info', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }), {
      path: '/',
      httpOnly: false, // Allow client access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    // Redirect based on user role
    const redirectUrl = '/dashboard';
    
    return json({ 
      success: true, 
      redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'An unexpected error occurred while processing your login request. Please try again later.' }, { status: 500 });
  }
};
