import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();
    console.log('🔍 API: Getting role for email:', email);

    if (!email) {
      console.log('❌ API: No email provided');
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        role: true
      }
    });

    if (!user) {
      console.log('❌ API: User not found, defaulting to client role');
      // Don't reveal if user exists or not for security
      return json({ role: 'client' }); // Default to client role
    }

    console.log('✅ API: User found with role:', user.role);
    return json({ 
      role: user.role || 'client'
    });

  } catch (error) {
    console.error('❌ API: Get user role error:', error);
    return json({ role: 'client' }); // Default to client role on error
  }
};
