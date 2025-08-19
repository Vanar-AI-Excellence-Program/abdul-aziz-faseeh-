import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import Credentials from '@auth/core/providers/credentials';
import bcrypt from 'bcryptjs';
import type { Provider } from '@auth/core/providers';
import GoogleProvider from '@auth/core/providers/google';
import GitHubProvider from '@auth/core/providers/github';

// Auth.js configuration
export const authHandle = SvelteKitAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }) as any,
  secret: process.env.AUTH_SECRET || 'your-secret-here',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.query.users.findFirst({
          where: (users) => eq(users.email, credentials.email as string)
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(credentials.password as string, user.password);

        if (!passwordMatch) return null;

        // Check admin approval for admin users only
        if (user.role === 'admin' && user.adminApproved !== 1) {
          return null; // Admin not approved, deny access
        }

        // Check email verification for all users
        if (user.isEmailVerified !== 1) {
          return null; // Email not verified, deny access
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        };
      }
    }) as Provider,
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }) as Provider,
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }) as Provider,
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

// Protect routes that require authentication
export const protectHandle = (async ({ event, resolve }) => {
  // List of protected routes
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/admin',
  ];

  // List of admin-only routes (excluding login and register)
  const adminRoutes = [
    '/admin',
  ];

  // List of public routes that should not be protected
  const publicRoutes = [
    '/admin/login',
    '/admin/register',
    '/login',
    '/register',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ];

  const session = await event.locals.getSession();
  const path = event.url.pathname;

  // Skip protection for public routes
  if (publicRoutes.some(route => path.startsWith(route))) {
    return resolve(event);
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

  if (isProtectedRoute && !session) {
    throw redirect(303, '/login');
  }

  // Check for admin access
  if (isAdminRoute && session?.user?.role !== 'admin') {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
}) satisfies Handle;

// Combine the auth and protect handles
export const handle = sequence(authHandle.handle, protectHandle) as Handle;