import { db } from '$lib/server/db';
import { chatSessions, chatMessages } from '$lib/server/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

export interface TreeNode {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  children: TreeNode[];
  orderIndex: number;
}

export class TreeChatService {
  /**
   * Get chat session with tree-structured messages
   */
  static async getSessionTree(sessionId: string, userId: string): Promise<TreeNode[]> {
    const session = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (session.length === 0) {
      throw new Error('Session not found or access denied');
    }

    // Get all messages for this session
    const allMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.orderIndex));

    // Build tree structure
    const messageMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    allMessages.forEach(msg => {
      messageMap.set(msg.id, {
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
        children: [],
        orderIndex: msg.orderIndex
      });
    });

    // Second pass: build parent-child relationships
    allMessages.forEach(msg => {
      const node = messageMap.get(msg.id);
      if (node) {
        if (msg.parentMessageId) {
          const parent = messageMap.get(msg.parentMessageId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          rootNodes.push(node);
        }
      }
    });

    // Sort by orderIndex
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.orderIndex - b.orderIndex);
      nodes.forEach(node => sortNodes(node.children));
    };

    sortNodes(rootNodes);
    return rootNodes;
  }

  /**
   * Add a new message to the chat tree
   */
  static async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    parentMessageId?: string
  ): Promise<string> {
    // Get the next order index
    const lastMessage = await db
      .select({ orderIndex: chatMessages.orderIndex })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.orderIndex))
      .limit(1);

    const nextOrderIndex = lastMessage.length > 0 ? lastMessage[0].orderIndex + 1 : 0;

    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        sessionId,
        parentMessageId,
        role,
        content,
        orderIndex: nextOrderIndex
      })
      .returning({ id: chatMessages.id });

    return newMessage.id;
  }

  /**
   * Fork a conversation from a specific message
   */
  static async forkConversation(
    originalSessionId: string,
    userId: string,
    fromMessageId: string
  ): Promise<string> {
    // Create new session
    const [newSession] = await db
      .insert(chatSessions)
      .values({
        userId,
        title: 'Forked Conversation'
      })
      .returning({ id: chatSessions.id });

    // Get the message tree from the fork point
    const originalMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, originalSessionId))
      .orderBy(asc(chatMessages.orderIndex));

    // Find the fork point message
    const forkMessage = originalMessages.find(msg => msg.id === fromMessageId);
    if (!forkMessage) {
      throw new Error('Fork message not found');
    }

    // Copy messages from fork point onwards
    const forkIndex = forkMessage.orderIndex;
    const messagesToCopy = originalMessages.filter(msg => msg.orderIndex >= forkIndex);

    // Create new messages in the forked session
    for (const msg of messagesToCopy) {
      await this.addMessage(
        newSession.id,
        msg.role as 'user' | 'assistant',
        msg.content,
        msg.parentMessageId
      );
    }

    return newSession.id;
  }

  /**
   * Get user's chat sessions
   */
  static async getUserSessions(userId: string) {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
  }

  /**
   * Update session title
   */
  static async updateSessionTitle(sessionId: string, userId: string, title: string) {
    return await db
      .update(chatSessions)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
  }

  /**
   * Delete a chat session and all its messages
   */
  static async deleteSession(sessionId: string, userId: string) {
    // Delete messages first (cascade should handle this, but explicit for safety)
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId));

    // Delete session
    return await db
      .delete(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
  }
}
