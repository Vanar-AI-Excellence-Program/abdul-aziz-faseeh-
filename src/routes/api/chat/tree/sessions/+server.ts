import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TreeChatService } from '$lib/server/services/tree-chat-service';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await TreeChatService.getUserSessions(session.user.id);

    return json({ sessions });

  } catch (error) {
    console.error('Get tree sessions error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await request.json();
    const sessionId = await TreeChatService.createSession(session.user.id, title);

    return json({ sessionId });

  } catch (error) {
    console.error('Create tree session error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
