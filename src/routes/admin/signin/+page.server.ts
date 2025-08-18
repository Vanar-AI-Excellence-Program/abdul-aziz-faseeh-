import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  
  // If already logged in as admin, redirect to admin dashboard
  if (session?.user?.role === 'admin') {
    throw redirect(302, '/admin/dashboard');
  }

  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return fail(400, {
        error: 'Both email and password are required to sign in. Please fill in all fields.'
      });
    }

    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user) {
        return fail(400, {
          error: 'The email or password you entered is incorrect. Please try again or contact support if you need assistance.'
        });
      }

      // Check if user is trying to sign in as admin
      if (user.role === 'admin') {
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password || '');
        
        if (!isPasswordValid) {
          return fail(400, {
            error: 'The password you entered is incorrect. Please try again or reset your password if you have forgotten it.'
          });
        }

        // Check if admin is approved
        if (!user.adminApproved) {
          return fail(400, {
            error: 'Your admin account is pending approval. Please wait for an existing admin to approve your access. Contact support if you have any questions.'
          });
        }

        // For SvelteKit Auth, we don't manually create sessions
        // The user will be redirected to the admin dashboard
        throw redirect(302, '/admin/dashboard');
      } else {
        // User is not an admin
        return fail(400, {
          error: 'This account does not have admin privileges. Please sign in through the regular login page.'
        });
      }
    } catch (error) {
      console.error('Admin signin error:', error);
      return fail(500, {
        error: 'An unexpected error occurred while processing your sign-in request. Please try again later.'
      });
    }
  }
};
