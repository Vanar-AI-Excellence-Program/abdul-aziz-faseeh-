import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TreeChatService } from '$lib/server/services/tree-chat-service';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, fromMessageId, newUserMessage } = await request.json();

    if (!sessionId || !fromMessageId || !newUserMessage) {
      return json({ error: 'Session ID, from message ID, and new user message are required' }, { status: 400 });
    }

    const newMessageId = await TreeChatService.forkConversation(
      sessionId,
      session.user.id,
      fromMessageId,
      newUserMessage
    );

    return json({ messageId: newMessageId });

  } catch (error) {
    console.error('Fork conversation error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
