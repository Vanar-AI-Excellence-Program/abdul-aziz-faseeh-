-- Migration: Add tree-structured chat fields
-- This migration adds support for conversation branching like ChatGPT

-- Add new columns to chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN parent_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
ADD COLUMN is_active INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN branch_order INTEGER DEFAULT 0 NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS chat_messages_parent_idx ON chat_messages(parent_id);
CREATE INDEX IF NOT EXISTS chat_messages_active_idx ON chat_messages(session_id, is_active);
CREATE INDEX IF NOT EXISTS chat_messages_branch_order_idx ON chat_messages(session_id, parent_id, branch_order);

-- Update existing messages to have proper tree structure
-- Set all existing messages as active and with sequential branch order
UPDATE chat_messages 
SET is_active = 1, 
    branch_order = (
      SELECT COALESCE(MAX(branch_order), -1) + 1 
      FROM chat_messages cm2 
      WHERE cm2.session_id = chat_messages.session_id 
      AND cm2.id < chat_messages.id
    )
WHERE parent_id IS NULL;

-- For messages with parents, set them as active and with proper branch order
UPDATE chat_messages 
SET is_active = 1,
    branch_order = (
      SELECT COALESCE(MAX(branch_order), -1) + 1 
      FROM chat_messages cm2 
      WHERE cm2.parent_id = chat_messages.parent_id 
      AND cm2.id < chat_messages.id
    )
WHERE parent_id IS NOT NULL;
