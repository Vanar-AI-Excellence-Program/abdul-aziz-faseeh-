import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();

  // Check if user is authenticated
  if (!session?.user) {
    throw redirect(303, '/admin/login');
  }

  // Only allow admin users
  if (session.user.role !== 'admin') {
    throw redirect(303, '/dashboard');
  }

  // Return session for admin users to show admin page
  return {
    session
  };
};
