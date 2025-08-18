import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Get session using Auth.js
  const session = await locals.getSession();
  
  return {
    session
  };
};