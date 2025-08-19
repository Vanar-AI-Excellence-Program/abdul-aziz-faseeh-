import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ChatHistoryService } from '$lib/server/services/chat-history-service';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get all branches in the session
    const branches = await ChatHistoryService.getSessionBranches(sessionId, session.user.id);

    return json({ branches });

  } catch (error) {
    console.error('Error getting session branches:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
