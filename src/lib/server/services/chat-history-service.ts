import { db } from '$lib/server/db';
import { chatSessions, chatMessages, users } from '$lib/server/db/schema';
import { eq, and, desc, inArray, notInArray, ne } from 'drizzle-orm';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  userName?: string;
  parentMessageId?: string;
  orderIndex?: number;
}

export interface ChatSessionData {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export class ChatHistoryService {
  /**
   * Get or create a chat session for a user
   */
  static async getOrCreateSession(userId: string): Promise<string> {
    // Try to get the most recent active session
    const existingSession = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(1);

    if (existingSession.length > 0) {
      // Update the session's updatedAt timestamp
      await db
        .update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessions.id, existingSession[0].id));
      
      return existingSession[0].id;
    }

    // Create a new session
    const newSession = await db
      .insert(chatSessions)
      .values({
        userId,
        title: 'New Chat',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return newSession[0].id;
  }

  /**
   * Store a message in the database
   */
  static async storeMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    userName?: string,
    parentMessageId?: string
  ): Promise<string> {
    // For user messages, store the actual user name instead of "user"
    const roleToStore = role === 'user' && userName ? userName : role;
    
    // Get the next order index for this parent
    let orderIndex = 0;
    if (parentMessageId) {
      const siblings = await db
        .select({ orderIndex: chatMessages.orderIndex })
        .from(chatMessages)
        .where(eq(chatMessages.parentMessageId, parentMessageId))
        .orderBy(desc(chatMessages.orderIndex))
        .limit(1);
      
      if (siblings.length > 0) {
        orderIndex = siblings[0].orderIndex + 1;
      }
    }
    
    const message = await db
      .insert(chatMessages)
      .values({
        sessionId,
        parentMessageId,
        role: roleToStore,
        content,
        timestamp: new Date(),
        orderIndex
      })
      .returning();

    return message[0].id;
  }

  /**
   * Get chat history for a user with user information
   */
  static async getChatHistory(userId: string, limit: number = 50): Promise<ChatMessageData[]> {
    // Get the user's session
    const session = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(1);

    if (session.length === 0) {
      return [];
    }

    // Get messages - now the role column contains user names for user messages
    const messages = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        timestamp: chatMessages.timestamp
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, session[0].id))
      .orderBy(chatMessages.timestamp)
      .limit(limit);

    return messages.map(msg => {
      // Determine if this is a user message or assistant message
      const isUserMessage = msg.role !== 'assistant';
      
      return {
        id: msg.id,
        role: isUserMessage ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
        userName: isUserMessage ? msg.role : 'AI Assistant'
      };
    });
  }

  /**
   * Get messages for a specific session
   */
  static async getSessionMessages(sessionId: string, userId: string): Promise<ChatMessageData[]> {
    // First verify the session belongs to the user
    const session = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (session.length === 0) {
      return [];
    }

    // Get messages for the session
    const messages = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        timestamp: chatMessages.timestamp
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);

    return messages.map(msg => {
      // Determine if this is a user message or assistant message
      const isUserMessage = msg.role !== 'assistant';
      
      return {
        id: msg.id,
        role: isUserMessage ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
        userName: isUserMessage ? msg.role : undefined
      };
    });
  }

  /**
   * Get user's chat sessions
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

    // Get message count for each session
    const sessionsWithCount = await Promise.all(
      sessions.map(async (session) => {
        const messageCount = await db
          .select({ count: chatMessages.id })
          .from(chatMessages)
          .where(eq(chatMessages.sessionId, session.id));

        return {
          ...session,
          messageCount: messageCount.length
        };
      })
    );

    return sessionsWithCount;
  }

  /**
   * Create a new chat session
   */
  static async createNewSession(userId: string, title?: string): Promise<string> {
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
   * Delete a chat session and all its messages
   */
  static async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    // Verify the session belongs to the user
    const session = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));

    if (session.length === 0) {
      return false;
    }

    // Delete the session (messages will be deleted due to CASCADE)
    await db
      .delete(chatSessions)
      .where(eq(chatSessions.id, sessionId));

    return true;
  }

  /**
   * Get user information for a message
   */
  static async getUserInfo(userId: string): Promise<{ name: string; email: string } | null> {
    const user = await db
      .select({
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user.length > 0 ? user[0] : null;
  }

  /**
   * Get a specific chat session
   */
  static async getSession(sessionId: string, userId: string): Promise<ChatSessionData | null> {
    const session = await db
      .select({
        id: chatSessions.id,
        title: chatSessions.title,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt
      })
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (session.length === 0) {
      return null;
    }

    // Get message count for the session
    const messageCount = await db
      .select({ count: chatMessages.id })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId));

    return {
      ...session[0],
      messageCount: messageCount.length
    };
  }

  /**
   * Update session title
   */
  static async updateSessionTitle(sessionId: string, userId: string, title: string): Promise<boolean> {
    const result = await db
      .update(chatSessions)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Update a message content and create a new branch
   */
  static async updateMessage(messageId: string, userId: string, newContent: string): Promise<{ success: boolean; newMessageId?: string }> {
    // First verify the message belongs to the user by checking the session
    const message = await db
      .select({
        id: chatMessages.id,
        sessionId: chatMessages.sessionId,
        parentMessageId: chatMessages.parentMessageId
      })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(and(eq(chatMessages.id, messageId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (message.length === 0) {
      return { success: false };
    }

    // Create a new message with the updated content (this creates a new branch)
    const newMessage = await db
      .insert(chatMessages)
      .values({
        sessionId: message[0].sessionId,
        parentMessageId: message[0].parentMessageId, // Same parent as original
        role: 'user',
        content: newContent,
        timestamp: new Date(),
        orderIndex: 0 // This will be the new branch
      })
      .returning();

    return { success: true, newMessageId: newMessage[0].id };
  }

  /**
   * Get all children of a message (for tree structure)
   */
  static async getMessageChildren(messageId: string, userId: string): Promise<ChatMessageData[]> {
    // First verify the message belongs to the user
    const message = await db
      .select({
        id: chatMessages.id,
        sessionId: chatMessages.sessionId
      })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(and(eq(chatMessages.id, messageId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (message.length === 0) {
      return [];
    }

    // Get all children of this message
    const children = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        timestamp: chatMessages.timestamp,
        parentMessageId: chatMessages.parentMessageId,
        orderIndex: chatMessages.orderIndex
      })
      .from(chatMessages)
      .where(eq(chatMessages.parentMessageId, messageId))
      .orderBy(chatMessages.orderIndex, chatMessages.timestamp);

    return children.map(msg => {
      const isUserMessage = msg.role !== 'assistant';
      return {
        id: msg.id,
        role: isUserMessage ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
        userName: isUserMessage ? msg.role : undefined,
        parentMessageId: msg.parentMessageId,
        orderIndex: msg.orderIndex
      };
    });
  }

  /**
   * Get conversation branch (path from root to a specific message)
   */
  static async getConversationBranch(messageId: string, userId: string): Promise<ChatMessageData[]> {
    // First verify the message belongs to the user
    const message = await db
      .select({
        id: chatMessages.id,
        sessionId: chatMessages.sessionId
      })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(and(eq(chatMessages.id, messageId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (message.length === 0) {
      return [];
    }

    // Get the conversation path by traversing up the tree
    const branch: ChatMessageData[] = [];
    let currentMessageId = messageId;

    while (currentMessageId) {
      const msg = await db
        .select({
          id: chatMessages.id,
          role: chatMessages.role,
          content: chatMessages.content,
          timestamp: chatMessages.timestamp,
          parentMessageId: chatMessages.parentMessageId,
          orderIndex: chatMessages.orderIndex
        })
        .from(chatMessages)
        .where(eq(chatMessages.id, currentMessageId))
        .limit(1);

      if (msg.length === 0) break;

      const isUserMessage = msg[0].role !== 'assistant';
      branch.unshift({
        id: msg[0].id,
        role: isUserMessage ? 'user' : 'assistant',
        content: msg[0].content,
        timestamp: msg[0].timestamp,
        userName: isUserMessage ? msg[0].role : undefined,
        parentMessageId: msg[0].parentMessageId,
        orderIndex: msg[0].orderIndex
      });

      currentMessageId = msg[0].parentMessageId || '';
    }

    return branch;
  }

  /**
   * Get all branches in a session (for tree view)
   */
  static async getSessionBranches(sessionId: string, userId: string): Promise<ChatMessageData[][]> {
    // First verify the session belongs to the user
    const session = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (session.length === 0) {
      return [];
    }

    // Get all leaf messages (messages with no children)
    const leafMessages = await db
      .select({
        id: chatMessages.id
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .where(
        notInArray(
          chatMessages.id,
          db.select({ parentMessageId: chatMessages.parentMessageId })
            .from(chatMessages)
            .where(eq(chatMessages.sessionId, sessionId))
            .where(ne(chatMessages.parentMessageId, null))
        )
      );

    // Get the full branch for each leaf
    const branches = await Promise.all(
      leafMessages.map(leaf => this.getConversationBranch(leaf.id, userId))
    );

    return branches.filter(branch => branch.length > 0);
  }

  /**
   * Get user chat statistics
   */
  static async getUserChatStats(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    lastActivity: Date | null;
  }> {
    // Get total sessions
    const sessions = await db
      .select({ id: chatSessions.id, updatedAt: chatSessions.updatedAt })
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId));

    // Get total messages
    const messages = await db
      .select({ id: chatMessages.id, timestamp: chatMessages.timestamp })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(eq(chatSessions.userId, userId));

    return {
      totalSessions: sessions.length,
      totalMessages: messages.length,
      lastActivity: messages.length > 0 ? new Date(Math.max(...messages.map(m => m.timestamp.getTime()))) : null
    };
  }
}
