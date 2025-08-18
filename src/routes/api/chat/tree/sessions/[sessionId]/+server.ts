import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TreeChatService } from '$lib/server/services/tree-chat-service';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    
    // Get the active conversation path (linear view)
    const conversationPath = await TreeChatService.getActiveConversationPath(sessionId, session.user.id);
    
    // Get the complete tree structure
    const tree = await TreeChatService.getSessionTree(sessionId, session.user.id);
    
    // Get available branches
    const branches = await TreeChatService.getAvailableBranches(sessionId, session.user.id);

    return json({
      conversationPath,
      tree,
      branches
    });

  } catch (error) {
    console.error('Get tree session error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    const { title } = await request.json();

    if (!title || typeof title !== 'string') {
      return json({ error: 'Title is required' }, { status: 400 });
    }

    // Update session title (you'll need to add this method to TreeChatService)
    // await TreeChatService.updateSessionTitle(sessionId, session.user.id, title);

    return json({ success: true });

  } catch (error) {
    console.error('Update tree session error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    
    // Delete session (you'll need to add this method to TreeChatService)
    // await TreeChatService.deleteSession(sessionId, session.user.id);

    return json({ success: true });

  } catch (error) {
    console.error('Delete tree session error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
