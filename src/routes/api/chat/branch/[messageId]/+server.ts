import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ChatHistoryService } from '$lib/server/services/chat-history-service';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const { messageId } = params;
    const session = await locals.getSession();

    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!messageId) {
      return json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get the conversation branch
    const branch = await ChatHistoryService.getConversationBranch(messageId, session.user.id);

    return json({ branch });

  } catch (error) {
    console.error('Error getting conversation branch:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
