import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TreeChatService } from '$lib/server/services/tree-chat-service';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, parentId, role, content } = await request.json();

    if (!sessionId || !role || !content) {
      return json({ error: 'Session ID, role, and content are required' }, { status: 400 });
    }

    const messageId = await TreeChatService.addMessage(
      sessionId,
      parentId || null,
      role,
      content,
      session.user.name
    );

    return json({ messageId });

  } catch (error) {
    console.error('Add tree message error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
