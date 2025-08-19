import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TreeChatService } from '$lib/server/services/tree-chat-service';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, targetMessageId } = await request.json();

    if (!sessionId || !targetMessageId) {
      return json({ error: 'Session ID and target message ID are required' }, { status: 400 });
    }

    const conversationPath = await TreeChatService.switchBranch(
      sessionId,
      session.user.id,
      targetMessageId
    );

    return json({ conversationPath });

  } catch (error) {
    console.error('Switch branch error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
