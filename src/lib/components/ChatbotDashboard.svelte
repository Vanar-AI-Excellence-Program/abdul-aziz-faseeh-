<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import AutoResizeTextarea from '$lib/components/ui/AutoResizeTextarea.svelte';
  import LoadingDots from '$lib/components/ui/LoadingDots.svelte';
  import { formatMarkdown, sanitizeHtml } from '$lib/utils/markdown';

  export let session: any;

  interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    userName?: string;
  }

  interface ChatSession {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
  }

  let messages: ChatMessage[] = [];
  let chatSessions: ChatSession[] = [];
  let currentSessionId: string | null = null;
  let newMessage = '';
  let isLoading = false;
  let error = '';
  let sidebarOpen = false;
  let darkMode = false;
  let chatContainer: HTMLElement;
  let isEditingTitle = false;
  let editingTitle = '';
  let editingSessionId: string | null = null;
  let showScrollToBottom = false;

  // Initialize with welcome message and load chat sessions
  onMount(async () => {
    await loadChatSessions();
    await loadCurrentSession();
  });

  // Handle scroll events to show/hide scroll to bottom button
  function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    showScrollToBottom = !isNearBottom && scrollTop > 200;
  }

  // Scroll to bottom function
  function scrollToBottom() {
    if (chatContainer) {
      const messagesWrapper = chatContainer.querySelector('.messages-wrapper');
      if (messagesWrapper) {
        messagesWrapper.scrollTo({
          top: messagesWrapper.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }

  // Load all chat sessions for the user
  async function loadChatSessions() {
    try {
      console.log('Loading chat sessions...');
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        console.log('Chat sessions data:', data);
        chatSessions = data.sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        }));
        console.log('Processed chat sessions:', chatSessions);
      } else {
        console.error('Failed to load chat sessions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }

  // Load current session or create new one
  async function loadCurrentSession() {
    try {
      if (currentSessionId) {
        console.log('Loading specific session:', currentSessionId);
        // Load specific session
        const response = await fetch(`/api/chat/sessions/${currentSessionId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Session data:', data);
          if (data.messages && data.messages.length > 0) {
            messages = data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              userName: msg.userName
            }));
          } else {
            // Empty session, show welcome message
            messages = [
              {
                id: '1',
                role: 'assistant',
                content: `Hello ${session?.user?.name || 'there'}! I'm your AI assistant. How can I help you today?`,
                timestamp: new Date()
              }
            ];
          }
        }
      } else {
        // For new chat, just show welcome message
        messages = [
          {
            id: '1',
            role: 'assistant',
            content: `Hello ${session?.user?.name || 'there'}! I'm your AI assistant. How can I help you today?`,
            timestamp: new Date()
          }
        ];
      }
    } catch (error) {
      console.error('Failed to load chat session:', error);
      // Fallback to welcome message
      messages = [
        {
          id: '1',
          role: 'assistant',
          content: `Hello ${session?.user?.name || 'there'}! I'm your AI assistant. How can I help you today?`,
          timestamp: new Date()
        }
      ];
    }
  }

  // Scroll to bottom when new messages are added
  $: if (messages.length > 0) {
    setTimeout(() => {
      if (chatContainer) {
        const messagesWrapper = chatContainer.querySelector('.messages-wrapper');
        if (messagesWrapper) {
          messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
        } else {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }
    }, 100);
  }

  async function sendMessage() {
    if (!newMessage.trim() || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date(),
      userName: session?.user?.name
    };

    messages = [...messages, userMessage];
    const messageToSend = newMessage.trim();
    newMessage = '';
    isLoading = true;
    error = '';

    // Create assistant message placeholder
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    messages = [...messages, assistantMessage];

    try {
      // Use streaming API for real-time response
      // The API will create a new session if currentSessionId is null
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: currentSessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let streamedContent = '';
      let sessionInfoReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Decode the chunk and add to content
        const chunk = decoder.decode(value, { stream: true });
        
        // Check if this is the first chunk with session info
        if (!sessionInfoReceived && chunk.includes('session_info')) {
          try {
            const lines = chunk.split('\n');
            const sessionInfoLine = lines.find(line => line.includes('session_info'));
            if (sessionInfoLine) {
              const sessionInfo = JSON.parse(sessionInfoLine);
              if (sessionInfo.sessionId && !currentSessionId) {
                currentSessionId = sessionInfo.sessionId;
                console.log('Received session ID:', currentSessionId);
              }
            }
            // Remove the session info from the chunk and only keep the actual content
            const contentChunk = lines.filter(line => !line.includes('session_info')).join('\n');
            streamedContent += contentChunk;
          } catch (e) {
            // If parsing fails, treat as regular content
            streamedContent += chunk;
          }
          sessionInfoReceived = true;
        } else {
          streamedContent += chunk;
        }
        
        // Update the assistant message with the streamed content
        assistantMessage.content = streamedContent;
        messages = [...messages];
      }

      // Refresh chat sessions to update the current session
      await loadChatSessions();

    } catch (err) {
      console.error('Chat error:', err);
      error = err instanceof Error ? err.message : 'Failed to send message';
      
      // Remove the empty assistant message on error
      messages = messages.filter(msg => msg.id !== assistantMessage.id);
    } finally {
      isLoading = false;
    }
  }

  async function startNewChat() {
    currentSessionId = null;
    messages = [
      {
        id: '1',
        role: 'assistant',
        content: `Hello ${session?.user?.name || 'there'}! I'm your AI assistant. How can I help you today?`,
        timestamp: new Date()
      }
    ];
    error = '';
    sidebarOpen = false;
  }

  async function loadSession(sessionId: string) {
    currentSessionId = sessionId;
    await loadCurrentSession();
    sidebarOpen = false;
  }

  async function deleteSession(sessionId: string, event: Event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from local list
        chatSessions = chatSessions.filter(s => s.id !== sessionId);
        
        // If we deleted the current session, start a new chat
        if (currentSessionId === sessionId) {
          await startNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  function startEditingTitle(sessionId: string, currentTitle: string, event: Event) {
    event.stopPropagation();
    isEditingTitle = true;
    editingTitle = currentTitle;
    editingSessionId = sessionId;
  }

  async function saveTitle() {
    if (!editingSessionId || !editingTitle.trim()) {
      isEditingTitle = false;
      editingSessionId = null;
      return;
    }

    try {
      const response = await fetch(`/api/chat/sessions/${editingSessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: editingTitle.trim() })
      });

      if (response.ok) {
        // Update local list
        chatSessions = chatSessions.map(s => 
          s.id === editingSessionId 
            ? { ...s, title: editingTitle.trim() }
            : s
        );
      }
    } catch (error) {
      console.error('Failed to update title:', error);
    } finally {
      isEditingTitle = false;
      editingSessionId = null;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  }

  // Enhanced markdown formatting
  function formatMessageContent(content: string): string {
    if (!content) return '';
    const formatted = formatMarkdown(content);
    return sanitizeHtml(formatted);
  }

  function clearChat() {
    messages = [
      {
        id: '1',
        role: 'assistant',
        content: `Hello ${session?.user?.name || 'there'}! I'm your AI assistant. How can I help you today?`,
        timestamp: new Date()
      }
    ];
    error = '';
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function toggleDarkMode() {
    darkMode = !darkMode;
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
</script>

<svelte:head>
  <title>AI Chatbot | Dashboard</title>
  <style>
    @keyframes typing {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    
    .typing-cursor {
      animation: typing 1s infinite;
    }
    
    .streaming-text {
      transition: all 0.1s ease-out;
    }

    /* Custom scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
      transition: background-color 0.2s ease;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #4b5563;
    }
    
    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #6b7280;
    }

    /* Firefox scrollbar */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #d1d5db transparent;
    }

    .dark .custom-scrollbar {
      scrollbar-color: #4b5563 transparent;
    }

    /* Chat container scroll behavior */
    .chat-container {
      scroll-behavior: smooth;
      overflow-anchor: none;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Messages wrapper */
    .messages-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Ensure messages don't interfere with scroll */
    .message-item {
      flex-shrink: 0;
    }

    /* Session item hover effects */
    .session-item {
      transition: all 0.2s ease;
    }

    .session-item:hover {
      background-color: rgba(59, 130, 246, 0.1);
    }

    .dark .session-item:hover {
      background-color: rgba(59, 130, 246, 0.2);
    }

    .session-item.active {
      background-color: rgba(59, 130, 246, 0.15);
      border-left: 3px solid #3b82f6;
    }

    .dark .session-item.active {
      background-color: rgba(59, 130, 246, 0.25);
    }

    /* AI Response Styling */
    .ai-response {
      line-height: 1.6;
      font-size: 0.95rem;
    }

    .ai-response p {
      margin-bottom: 0.75rem;
    }

    .ai-response p:last-child {
      margin-bottom: 0;
    }

    .ai-response strong {
      font-weight: 600;
      color: inherit;
    }

    .ai-response ul, .ai-response ol {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }

    .ai-response li {
      margin-bottom: 0.25rem;
    }

    .ai-response code {
      background-color: rgba(0, 0, 0, 0.1);
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-size: 0.875em;
    }

    .dark .ai-response code {
      background-color: rgba(255, 255, 255, 0.1);
    }

    /* Typing animation */
    .typing-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .typing-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background-color: currentColor;
      animation: typing-bounce 1.4s infinite ease-in-out;
    }

    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes typing-bounce {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
  </style>
</svelte:head>

<div class="h-screen flex bg-white dark:bg-gray-900 transition-colors duration-300">
  <!-- Mobile Sidebar Overlay -->
  {#if sidebarOpen}
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
      onclick={toggleSidebar}
      onkeydown={(e) => e.key === 'Escape' && toggleSidebar()}
      role="button"
      tabindex="0"
      aria-label="Close sidebar"
      transition:fade={{ duration: 200 }}
    ></div>
  {/if}

  <!-- Left Sidebar -->
  <div 
    class="fixed lg:static inset-y-0 left-0 z-50 w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out {sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}"
    transition:fly={{ x: -320, duration: 300, easing: quintOut }}
  >
    <!-- Sidebar Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </div>
        <h1 class="text-lg font-bold text-gray-900 dark:text-white">AI Assistant</h1>
      </div>
      
      <!-- Close button for mobile -->
      <button
        onclick={toggleSidebar}
        class="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Close sidebar"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- New Chat Button -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <button
        onclick={startNewChat}
        class="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        <span>New Chat</span>
      </button>
    </div>

    <!-- Chat Sessions List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div class="p-4 space-y-2">
        {#each chatSessions as chatSession (chatSession.id)}
          <div 
            class="session-item relative group cursor-pointer rounded-lg p-3 {currentSessionId === chatSession.id ? 'active' : ''}"
            onclick={() => loadSession(chatSession.id)}
          >
            <!-- Session Title -->
            <div class="flex items-center justify-between">
              {#if isEditingTitle && editingSessionId === chatSession.id}
                <input
                  type="text"
                  bind:value={editingTitle}
                  onblur={saveTitle}
                  onkeydown={(e) => e.key === 'Enter' && saveTitle()}
                  class="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
                  autofocus
                />
              {:else}
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {chatSession.title}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(chatSession.updatedAt)} • {chatSession.messageCount} messages
                  </p>
                </div>
              {/if}
              
              <!-- Action Buttons -->
              <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onclick={(e) => startEditingTitle(chatSession.id, chatSession.title, e)}
                  class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title="Rename chat"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  onclick={(e) => deleteSession(chatSession.id, e)}
                  class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                  title="Delete chat"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Navigation -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
      <button
        onclick={() => window.location.href = '/dashboard'}
        class="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
        </svg>
        <span>Dashboard</span>
      </button>
      
      <button
        onclick={() => window.location.href = '/profile'}
        class="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span>Profile</span>
      </button>
    </div>

    <!-- User Info -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {session?.user?.name || 'User'}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session?.user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        
        <button
          onclick={toggleDarkMode}
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors duration-200"
        >
          {#if darkMode}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Main Chat Area -->
  <div class="flex-1 flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div class="flex items-center space-x-4">
        <button
          onclick={toggleSidebar}
          class="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors duration-200"
          aria-label="Open sidebar"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {currentSessionId ? chatSessions.find(s => s.id === currentSessionId)?.title || 'Chat' : 'New Chat'}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">AI Assistant</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span class="text-sm text-gray-500 dark:text-gray-400">Online</span>
        </div>
        
        <button
          onclick={clearChat}
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors duration-200"
          title="Clear chat"
          aria-label="Clear chat"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Messages Area -->
    <div 
      bind:this={chatContainer}
      class="flex-1 custom-scrollbar chat-container"
      onscroll={handleScroll}
    >
      <div class="messages-wrapper">
        {#each messages as message (message.id)}
          <div 
            class="message-item flex {message.role === 'user' ? 'justify-end' : 'justify-start'}"
            in:fly={{ y: 20, duration: 300, delay: 100 }}
          >
            <div class="max-w-2xl w-full">
              <div class="flex items-start space-x-3 {message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}">
                <!-- Avatar -->
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0
                  {message.role === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gray-600 dark:bg-gray-500'
                  }">
                  {message.role === 'user' ? (message.userName ? message.userName.charAt(0).toUpperCase() : 'U') : 'AI'}
                </div>
                
                <!-- Message Bubble -->
                <div class="flex-1">
                  <div class="px-4 py-3 rounded-2xl shadow-sm
                    {message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }">
                    <div class="prose prose-sm max-w-none dark:prose-invert {message.role === 'user' ? 'prose-invert' : ''}">
                      {#if message.role === 'assistant'}
                        <div class="ai-response whitespace-pre-wrap leading-relaxed">
                          {@html formatMessageContent(message.content)}
                        </div>
                      {:else}
                        <div class="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      {/if}
                      {#if message.role === 'assistant' && isLoading && message.content === ''}
                        <span class="inline-block w-2 h-4 bg-blue-500 dark:bg-blue-400 typing-cursor ml-1"></span>
                      {/if}
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-4">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        {/each}

        <!-- Loading Indicator -->
        {#if isLoading}
          <div class="message-item flex justify-start" in:fly={{ y: 20, duration: 300 }}>
            <div class="max-w-2xl w-full">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-500 flex items-center justify-center text-white text-sm font-semibold">
                  AI
                </div>
                <div class="flex-1">
                  <div class="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-sm">
                    <div class="flex items-center space-x-2">
                      <LoadingDots size="md" color="gray" />
                      <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Error Message -->
        {#if error}
          <div class="message-item flex justify-center" in:fly={{ y: 20, duration: 300 }}>
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 shadow-sm">
              <p class="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Scroll to Bottom Button -->
      {#if showScrollToBottom}
        <button
          onclick={scrollToBottom}
          class="fixed bottom-24 right-6 z-10 p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200"
          title="Scroll to bottom"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Input Area -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <div class="max-w-4xl mx-auto">
        <div class="flex space-x-4">
          <div class="flex-1">
            <AutoResizeTextarea
              bind:value={newMessage}
              placeholder="Type your message here..."
              disabled={isLoading}
              rows={1}
              maxRows={6}
              onkeydown={handleKeyPress}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            variant="primary"
            size="lg"
            class="px-6"
          >
            {#if isLoading}
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            {/if}
          </Button>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  </div>
</div>
