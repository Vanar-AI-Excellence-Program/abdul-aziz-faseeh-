import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ChatHistoryService } from '$lib/server/services/chat-history-service';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const { messageId } = params;
    const { content } = await request.json();
    const session = await locals.getSession();

    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!messageId || !content) {
      return json({ error: 'Message ID and content are required' }, { status: 400 });
    }

    // Update the message content and create a new branch
    const result = await ChatHistoryService.updateMessage(messageId, session.user.id, content);

    if (!result.success) {
      return json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    return json({ 
      success: true, 
      message: 'Message updated successfully',
      newMessageId: result.newMessageId 
    });

  } catch (error) {
    console.error('Error updating message:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
