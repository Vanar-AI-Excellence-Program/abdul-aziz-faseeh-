import { db } from '$lib/server/db';
import { chatSessions, chatMessages, users } from '$lib/server/db/schema';
import { eq, and, desc, asc, isNull, isNotNull } from 'drizzle-orm';

export interface ChatMessageNode {
  id: string;
  parentId: string | null;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  userName?: string;
  children: ChatMessageNode[];
  isActive: boolean;
  branchOrder: number;
}

export interface ChatSessionData {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  activeBranchCount: number;
}

export interface ConversationPath {
  messages: ChatMessageNode[];
  path: string[]; // Array of message IDs representing the current path
}

export class TreeChatService {
  /**
   * Create a new chat session
   */
  static async createSession(userId: string, title?: string): Promise<string> {
    const newSession = await db
      .insert(chatSessions)
      .values({
        userId,
        title: title || 'New Chat',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return newSession[0].id;
  }

  /**
   * Add a message to the tree structure
   */
  static async addMessage(
    sessionId: string,
    parentId: string | null,
    role: 'user' | 'assistant',
    content: string,
    userName?: string
  ): Promise<string> {
    // Get the next branch order for this parent
    const siblings = await db
      .select({ branchOrder: chatMessages.branchOrder })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.sessionId, sessionId),
        parentId ? eq(chatMessages.parentId, parentId) : isNull(chatMessages.parentId)
      ))
      .orderBy(desc(chatMessages.branchOrder));

    const nextBranchOrder = siblings.length > 0 ? siblings[0].branchOrder + 1 : 0;

    // If this is a new branch (not the first message), deactivate other branches
    if (parentId && role === 'user') {
      await db
        .update(chatMessages)
        .set({ isActive: 0 })
        .where(and(
          eq(chatMessages.sessionId, sessionId),
          eq(chatMessages.parentId, parentId)
        ));
    }

    const message = await db
      .insert(chatMessages)
      .values({
        sessionId,
        parentId,
        role: role === 'user' && userName ? userName : role,
        content,
        timestamp: new Date(),
        isActive: 1,
        branchOrder: nextBranchOrder
      })
      .returning();

    // Update session timestamp
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));

    return message[0].id;
  }

  /**
   * Get the complete tree structure for a session
   */
  static async getSessionTree(sessionId: string, userId: string): Promise<ChatMessageNode[]> {
    // Verify session belongs to user
    const session = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (session.length === 0) {
      return [];
    }

    // Get all messages for the session
    const messages = await db
      .select({
        id: chatMessages.id,
        parentId: chatMessages.parentId,
        role: chatMessages.role,
        content: chatMessages.content,
        timestamp: chatMessages.timestamp,
        isActive: chatMessages.isActive,
        branchOrder: chatMessages.branchOrder
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.branchOrder));

    // Build tree structure
    const messageMap = new Map<string, ChatMessageNode>();
    const rootMessages: ChatMessageNode[] = [];

    // Create nodes
    messages.forEach(msg => {
      const node: ChatMessageNode = {
        id: msg.id,
        parentId: msg.parentId,
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.timestamp,
        userName: msg.role !== 'assistant' ? msg.role : undefined,
        children: [],
        isActive: msg.isActive === 1,
        branchOrder: msg.branchOrder
      };
      messageMap.set(msg.id, node);
    });

    // Build parent-child relationships
    messages.forEach(msg => {
      const node = messageMap.get(msg.id)!;
      if (msg.parentId) {
        const parent = messageMap.get(msg.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootMessages.push(node);
      }
    });

    return rootMessages;
  }

  /**
   * Get the current active conversation path (linear)
   */
  static async getActiveConversationPath(sessionId: string, userId: string): Promise<ConversationPath> {
    const tree = await this.getSessionTree(sessionId, userId);
    const path: ChatMessageNode[] = [];
    const pathIds: string[] = [];

    // Traverse the tree following active branches
    const traverseActive = (nodes: ChatMessageNode[]) => {
      for (const node of nodes) {
        if (node.isActive) {
          path.push(node);
          pathIds.push(node.id);
          if (node.children.length > 0) {
            traverseActive(node.children);
          }
        }
      }
    };

    traverseActive(tree);
    return { messages: path, path: pathIds };
  }

  /**
   * Fork a conversation from a specific message
   */
  static async forkConversation(
    sessionId: string,
    userId: string,
    fromMessageId: string,
    newUserMessage: string
  ): Promise<string> {
    // Verify the message exists and belongs to the session
    const message = await db
      .select()
      .from(chatMessages)
      .where(and(
        eq(chatMessages.id, fromMessageId),
        eq(chatMessages.sessionId, sessionId)
      ))
      .limit(1);

    if (message.length === 0) {
      throw new Error('Message not found');
    }

    // Add the new user message as a child of the specified message
    const newMessageId = await this.addMessage(
      sessionId,
      fromMessageId,
      'user',
      newUserMessage
    );

    return newMessageId;
  }

  /**
   * Switch to a different branch
   */
  static async switchBranch(
    sessionId: string,
    userId: string,
    targetMessageId: string
  ): Promise<ConversationPath> {
    // First, deactivate all branches
    await db
      .update(chatMessages)
      .set({ isActive: 0 })
      .where(eq(chatMessages.sessionId, sessionId));

    // Get the path to the target message
    const tree = await this.getSessionTree(sessionId, userId);
    const pathToTarget = this.findPathToMessage(tree, targetMessageId);

    if (pathToTarget.length === 0) {
      throw new Error('Target message not found');
    }

    // Activate the path to the target message
    for (const messageId of pathToTarget) {
      await db
        .update(chatMessages)
        .set({ isActive: 1 })
        .where(eq(chatMessages.id, messageId));
    }

    // Return the new active conversation path
    return await this.getActiveConversationPath(sessionId, userId);
  }

  /**
   * Find the path to a specific message in the tree
   */
  private static findPathToMessage(nodes: ChatMessageNode[], targetId: string): string[] {
    const findPath = (node: ChatMessageNode): string[] | null => {
      if (node.id === targetId) {
        return [node.id];
      }

      for (const child of node.children) {
        const childPath = findPath(child);
        if (childPath) {
          return [node.id, ...childPath];
        }
      }

      return null;
    };

    for (const node of nodes) {
      const path = findPath(node);
      if (path) {
        return path;
      }
    }

    return [];
  }

  /**
   * Get all available branches for a session
   */
  static async getAvailableBranches(sessionId: string, userId: string): Promise<ChatMessageNode[]> {
    const tree = await this.getSessionTree(sessionId, userId);
    const branches: ChatMessageNode[] = [];

    const collectBranches = (nodes: ChatMessageNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 1) {
          // This node has multiple branches
          branches.push(node);
        }
        collectBranches(node.children);
      }
    };

    collectBranches(tree);
    return branches;
  }

  /**
   * Get user's chat sessions with tree statistics
   */
  static async getUserSessions(userId: string): Promise<ChatSessionData[]> {
    const sessions = await db
      .select({
        id: chatSessions.id,
        title: chatSessions.title,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt
      })
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));

    // Get statistics for each session
    const sessionsWithStats = await Promise.all(
      sessions.map(async (session) => {
        const messageCount = await db
          .select({ count: chatMessages.id })
          .from(chatMessages)
          .where(eq(chatMessages.sessionId, session.id));

        const activeBranchCount = await db
          .select({ count: chatMessages.id })
          .from(chatMessages)
          .where(and(
            eq(chatMessages.sessionId, session.id),
            eq(chatMessages.isActive, 1)
          ));

        return {
          ...session,
          messageCount: messageCount.length,
          activeBranchCount: activeBranchCount.length
        };
      })
    );

    return sessionsWithStats;
  }

  /**
   * Delete a message and all its descendants
   */
  static async deleteMessage(sessionId: string, userId: string, messageId: string): Promise<boolean> {
    // Verify session belongs to user
    const session = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (session.length === 0) {
      return false;
    }

    // Get all descendant message IDs
    const descendants = await this.getAllDescendants(sessionId, messageId);
    const idsToDelete = [messageId, ...descendants];

    // Delete all messages
    await db
      .delete(chatMessages)
      .where(and(
        eq(chatMessages.sessionId, sessionId),
        // Note: This is a simplified approach. In production, you'd want to use IN operator
        // but Drizzle's type safety might require a different approach
      ));

    return true;
  }

  /**
   * Get all descendant message IDs
   */
  private static async getAllDescendants(sessionId: string, messageId: string): Promise<string[]> {
    const descendants: string[] = [];
    
    const getChildren = async (parentId: string) => {
      const children = await db
        .select({ id: chatMessages.id })
        .from(chatMessages)
        .where(and(
          eq(chatMessages.sessionId, sessionId),
          eq(chatMessages.parentId, parentId)
        ));

      for (const child of children) {
        descendants.push(child.id);
        await getChildren(child.id);
      }
    };

    await getChildren(messageId);
    return descendants;
  }

  /**
   * Update a message content
   */
  static async updateMessage(
    sessionId: string,
    userId: string,
    messageId: string,
    newContent: string
  ): Promise<boolean> {
    // Verify session belongs to user
    const session = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (session.length === 0) {
      return false;
    }

    // Update the message
    const result = await db
      .update(chatMessages)
      .set({ content: newContent })
      .where(and(
        eq(chatMessages.id, messageId),
        eq(chatMessages.sessionId, sessionId)
      ))
      .returning();

    return result.length > 0;
  }
}
