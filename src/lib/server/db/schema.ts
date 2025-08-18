import { pgTable, varchar, uuid, timestamp, boolean, text, index } from 'drizzle-orm/pg-core';
import { integer, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    password: varchar('password', { length: 255 }),
    role: varchar('role', { length: 32 }).notNull().default('user'),
    adminApproved: boolean('admin_approved').default(false),
    image: varchar('image', { length: 255 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, (table) => {
    return {
        emailIdx: index('email_idx').on(table.email),
    }
});

export const sessions = pgTable('sessions', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
});

// OAuth accounts table (used by Auth.js)
export const accounts = pgTable('accounts', {
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	type: varchar('type', { length: 255 }).notNull(),
	provider: varchar('provider', { length: 255 }).notNull(),
	providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
	refresh_token: text('refresh_token'),
	access_token: text('access_token'),
	expires_at: integer('expires_at'),
	token_type: varchar('token_type', { length: 255 }),
	scope: varchar('scope', { length: 255 }),
	id_token: text('id_token'),
	session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
	compoundKey: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

export const verificationTokens = pgTable('verification_token', {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
    compoundKey: index('verification_token_compound_key').on(vt.identifier, vt.token),
}));

// Tree-structured chat history tables
export const chatSessions = pgTable('chat_sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 255 }),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
	parentMessageId: uuid('parent_message_id'), // For tree structure, nullable
	role: varchar('role', { length: 50 }).notNull(), // 'user' or 'assistant'
	content: text('content').notNull(),
	timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
	orderIndex: integer('order_index').notNull().default(0), // For maintaining conversation order
}, (table) => ({
	sessionIdIdx: index('chat_messages_session_idx').on(table.sessionId),
	parentMessageIdIdx: index('chat_messages_parent_idx').on(table.parentMessageId),
	orderIdx: index('chat_messages_order_idx').on(table.sessionId, table.orderIndex),
}));