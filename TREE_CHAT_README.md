# Tree-Structured Chat System

A ChatGPT-like conversation branching system that allows users to fork conversations from any message and explore different conversation paths.

## 🚀 Features

### Core Functionality
- **Tree Data Structure**: Messages stored in a hierarchical tree instead of flat arrays
- **Conversation Branching**: Fork conversations from any message to create new paths
- **Branch Switching**: Switch between different conversation branches seamlessly
- **Message Editing**: Edit any message to create new conversation paths
- **Active Path Tracking**: Always shows the current active conversation path

### Key Components

#### Database Schema
```sql
-- Enhanced chat_messages table with tree support
chat_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id),
  parent_id UUID REFERENCES chat_messages(id), -- Tree structure
  role VARCHAR(32), -- 'user' or 'assistant'
  content TEXT,
  timestamp TIMESTAMP,
  is_active INTEGER DEFAULT 1, -- Active branch indicator
  branch_order INTEGER DEFAULT 0 -- Order within siblings
)
```

#### TreeChatService
The core service that manages the tree-structured chat:

```typescript
// Add a message to the tree
TreeChatService.addMessage(sessionId, parentId, role, content, userName)

// Get the active conversation path (linear view)
TreeChatService.getActiveConversationPath(sessionId, userId)

// Fork a conversation from any message
TreeChatService.forkConversation(sessionId, userId, fromMessageId, newUserMessage)

// Switch to a different branch
TreeChatService.switchBranch(sessionId, userId, targetMessageId)

// Get all available branches
TreeChatService.getAvailableBranches(sessionId, userId)
```

## 🎯 How It Works

### 1. Message Tree Structure
Each message can have multiple children, creating a tree structure:
```
Message A
├── Message B (User response)
│   ├── Message C (AI response)
│   └── Message D (Alternative user response) ← Fork
│       └── Message E (AI response to fork)
└── Message F (Another user response)
    └── Message G (AI response)
```

### 2. Active Path Tracking
The system maintains an "active" flag on messages to track the current conversation path:
- Only one branch can be active at each fork point
- The active path represents the current linear conversation
- Switching branches updates the active flags

### 3. Conversation Forking
When a user wants to explore a different response:
1. Click "Fork" on any message
2. Enter a new user message
3. System creates a new branch under that message
4. New branch becomes active, old branch becomes inactive

### 4. Branch Switching
Users can switch between different conversation paths:
1. View available branches in the sidebar
2. Click on any branch to switch to it
3. System updates active flags and shows the new path

## 🔧 API Endpoints

### Tree Sessions
- `GET /api/chat/tree/sessions` - Get user's chat sessions
- `POST /api/chat/tree/sessions` - Create new session
- `GET /api/chat/tree/sessions/[sessionId]` - Get session with tree data
- `PUT /api/chat/tree/sessions/[sessionId]` - Update session title
- `DELETE /api/chat/tree/sessions/[sessionId]` - Delete session

### Tree Messages
- `POST /api/chat/tree/messages` - Add message to tree
- `PUT /api/chat/tree/messages/[messageId]` - Update message content
- `DELETE /api/chat/tree/messages/[messageId]` - Delete message and descendants

### Branching Operations
- `POST /api/chat/tree/fork` - Fork conversation from message
- `POST /api/chat/tree/branch` - Switch to different branch

## 🎨 UI Features

### TreeChatDashboard Component
- **Message Actions**: Edit and fork buttons on hover
- **Branch Indicators**: Visual indicators for messages with multiple branches
- **Branch Selector**: Sidebar showing available conversation branches
- **Active Path Display**: Shows current conversation path
- **Fork Creation**: Easy forking from any message

### Visual Elements
- **Branch Dots**: Small indicators showing messages with multiple branches
- **Active Path Highlighting**: Current conversation path is highlighted
- **Fork Buttons**: Click any message to create a new branch
- **Branch Navigation**: Switch between different conversation paths

## 🚀 Usage Examples

### Creating a Fork
```typescript
// User clicks "Fork" on a message
const newMessageId = await TreeChatService.forkConversation(
  sessionId,
  userId,
  fromMessageId,
  "What if we approach this differently?"
);
```

### Switching Branches
```typescript
// User selects a different branch
const conversationPath = await TreeChatService.switchBranch(
  sessionId,
  userId,
  targetMessageId
);
```

### Getting Active Conversation
```typescript
// Get current linear conversation
const activePath = await TreeChatService.getActiveConversationPath(
  sessionId,
  userId
);
```

## 🔄 Migration

Run the migration to add tree structure support:

```bash
# Apply the migration
npm run db:migrate

# Or manually run the SQL
psql -d your_database -f drizzle/0005_tree_chat_structure.sql
```

## 🎯 Benefits

1. **Exploration**: Users can explore different conversation paths
2. **Non-destructive**: Original conversations are preserved
3. **Flexibility**: Fork from any point in the conversation
4. **Clarity**: Clear visual indication of conversation structure
5. **Efficiency**: Only active paths are processed for AI responses

## 🔮 Future Enhancements

- **Branch Merging**: Merge different conversation paths
- **Branch Comparison**: Compare different conversation outcomes
- **Branch Templates**: Save and reuse conversation patterns
- **Collaborative Branching**: Multiple users can contribute to branches
- **Branch Analytics**: Track which branches are most popular

## 🛠️ Technical Implementation

### Database Optimization
- Indexes on `parent_id`, `is_active`, and `branch_order`
- Efficient tree traversal queries
- Cascading deletes for branch cleanup

### Performance Considerations
- Lazy loading of branch data
- Efficient active path calculation
- Minimal database queries for tree operations

### Scalability
- Tree structure supports unlimited branching
- Efficient storage with parent-child relationships
- Fast branch switching operations

This tree-structured chat system provides a powerful foundation for exploring different conversation paths, similar to ChatGPT's conversation branching feature.
