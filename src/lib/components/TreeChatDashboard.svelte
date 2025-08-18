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

  interface ChatMessageNode {
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

  interface ChatSessionData {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    activeBranchCount: number;
  }

  let messages: ChatMessageNode[] = [];
  let chatSessions: ChatSessionData[] = [];
  let currentSessionId: string | null = null;
  let newMessage = '';
  let isLoading = false;
  let error = '';
  let sidebarOpen = false;
  let darkMode = false;
  let chatContainer: HTMLElement;
  let showScrollToBottom = false;
  let editingMessageId: string | null = null;
  let editingContent = '';
  let showBranchSelector = false;
  let availableBranches: ChatMessageNode[] = [];

  onMount(async () => {
    await loadChatSessions();
    await loadCurrentSession();
  });

  async function loadChatSessions() {
    try {
      const response = await fetch('/api/chat/tree/sessions');
      if (response.ok) {
        const data = await response.json();
        chatSessions = data.sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }

  async function loadCurrentSession() {
    try {
      if (currentSessionId) {
        const response = await fetch(`/api/chat/tree/sessions/${currentSessionId}`);
        if (response.ok) {
          const data = await response.json();
          messages = data.conversationPath.messages;
          availableBranches = data.branches;
        }
      } else {
        messages = [
          {
            id: '1',
            parentId: null,
            role: 'assistant',
            content: `Hello ${session?.user?.name || 'there'}! I'm your AI assistant. How can I help you today?`,
            timestamp: new Date(),
            children: [],
            isActive: true,
            branchOrder: 0
          }
        ];
      }
    } catch (error) {
      console.error('Failed to load chat session:', error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: newMessage.trim(),
      timestamp: new Date(),
      userName: session?.user?.name
    };

    messages = [...messages, userMessage];
    const messageToSend = newMessage.trim();
    newMessage = '';
    isLoading = true;
    error = '';

    try {
      // Create new session if needed
      if (!currentSessionId) {
        const createResponse = await fetch('/api/chat/tree/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: messageToSend.substring(0, 50) + (messageToSend.length > 50 ? '...' : '')
          })
        });
        
        if (createResponse.ok) {
          const sessionData = await createResponse.json();
          currentSessionId = sessionData.sessionId;
        }
      }

      // Add user message to tree
      const lastMessageId = messages.length > 1 ? messages[messages.length - 2].id : null;
      await fetch('/api/chat/tree/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          parentId: lastMessageId,
          role: 'user',
          content: messageToSend
        })
      });

      // Get AI response
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: currentSessionId
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let streamedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;
        
        // Update the last message (AI response)
        if (messages.length > 0) {
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content: streamedContent
          };
          messages = [...messages];
        }
      }

      // Add AI response to tree
      await fetch('/api/chat/tree/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          parentId: userMessage.id,
          role: 'assistant',
          content: streamedContent
        })
      });

      await loadChatSessions();
      await loadCurrentSession();

    } catch (err) {
      console.error('Chat error:', err);
      error = err instanceof Error ? err.message : 'Failed to send message';
    } finally {
      isLoading = false;
    }
  }

  async function forkConversation(messageId: string) {
    const newMessage = prompt('Enter your new message to fork the conversation:');
    if (!newMessage || !currentSessionId) return;

    try {
      const response = await fetch('/api/chat/tree/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          fromMessageId: messageId,
          newUserMessage: newMessage
        })
      });

      if (response.ok) {
        await loadCurrentSession();
      }
    } catch (error) {
      console.error('Failed to fork conversation:', error);
    }
  }

  async function switchBranch(targetMessageId: string) {
    if (!currentSessionId) return;

    try {
      const response = await fetch('/api/chat/tree/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          targetMessageId
        })
      });

      if (response.ok) {
        const data = await response.json();
        messages = data.conversationPath.messages;
        showBranchSelector = false;
      }
    } catch (error) {
      console.error('Failed to switch branch:', error);
    }
  }

  function startEditing(messageId: string, content: string) {
    editingMessageId = messageId;
    editingContent = content;
  }

  async function saveEdit() {
    if (!editingMessageId || !currentSessionId) return;

    try {
      const response = await fetch(`/api/chat/tree/messages/${editingMessageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent })
      });

      if (response.ok) {
        await loadCurrentSession();
      }
    } catch (error) {
      console.error('Failed to update message:', error);
    } finally {
      editingMessageId = null;
      editingContent = '';
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

  function formatMessageContent(content: string): string {
    if (!content) return '';
    const formatted = formatMarkdown(content);
    return sanitizeHtml(formatted);
  }

  function clearChat() {
    messages = [
      {
        id: '1',
        parentId: null,
        role: 'assistant',
        content: `Hello ${session?.user?.name || 'there'}! I'm your AI assistant. How can I help you today?`,
        timestamp: new Date(),
        children: [],
        isActive: true,
        branchOrder: 0
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
  <title>Tree Chat | Dashboard</title>
  <style>
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

    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #d1d5db transparent;
    }

    .dark .custom-scrollbar {
      scrollbar-color: #4b5563 transparent;
    }

    .message-item {
      position: relative;
    }

    .message-actions {
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .message-item:hover .message-actions {
      opacity: 1;
    }

    .branch-indicator {
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #3b82f6;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .dark .branch-indicator {
      border-color: #1f2937;
    }
  </style>
</svelte:head>

<div class="h-screen flex bg-white dark:bg-gray-900 transition-colors duration-300">
  <!-- Mobile Sidebar Overlay -->
  {#if sidebarOpen}
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
      onclick={toggleSidebar}
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
        <h1 class="text-lg font-bold text-gray-900 dark:text-white">Tree Chat</h1>
      </div>
      
      <button
        onclick={toggleSidebar}
        class="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- New Chat Button -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <button
        onclick={() => { currentSessionId = null; clearChat(); }}
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
            class="relative group cursor-pointer rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            onclick={() => { currentSessionId = chatSession.id; loadCurrentSession(); }}
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {chatSession.title}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {chatSession.messageCount} messages • {chatSession.activeBranchCount} active branches
              </p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Branch Selector -->
    {#if showBranchSelector && availableBranches.length > 0}
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Available Branches</h3>
        <div class="space-y-1">
          {#each availableBranches as branch}
            <button
              onclick={() => switchBranch(branch.id)}
              class="w-full text-left p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
            >
              {branch.content.substring(0, 50)}...
            </button>
          {/each}
        </div>
      </div>
    {/if}

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
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {currentSessionId ? chatSessions.find(s => s.id === currentSessionId)?.title || 'Chat' : 'New Chat'}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Tree-structured AI Assistant</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          onclick={() => showBranchSelector = !showBranchSelector}
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors duration-200"
          title="Show branches"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <button
          onclick={clearChat}
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors duration-200"
          title="Clear chat"
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
      class="flex-1 custom-scrollbar overflow-y-auto p-4"
    >
      <div class="max-w-4xl mx-auto space-y-6">
        {#each messages as message, index (message.id)}
          <div class="message-item flex {message.role === 'user' ? 'justify-end' : 'justify-start'} relative">
            {#if message.children && message.children.length > 1}
              <div class="branch-indicator" title="Multiple branches available"></div>
            {/if}
            
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
                <div class="flex-1 relative">
                  <div class="px-4 py-3 rounded-2xl shadow-sm
                    {message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }">
                    {#if editingMessageId === message.id}
                      <AutoResizeTextarea
                        bind:value={editingContent}
                        class="w-full bg-transparent border-none outline-none resize-none"
                        rows={1}
                        onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && saveEdit()}
                        autofocus
                      />
                    {:else}
                      <div class="prose prose-sm max-w-none dark:prose-invert {message.role === 'user' ? 'prose-invert' : ''}">
                        {#if message.role === 'assistant'}
                          <div class="whitespace-pre-wrap leading-relaxed">
                            {@html formatMessageContent(message.content)}
                          </div>
                        {:else}
                          <div class="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Message Actions -->
                  <div class="message-actions absolute top-2 right-2 flex space-x-1">
                    {#if message.role === 'user'}
                      <button
                        onclick={() => startEditing(message.id, message.content)}
                        class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded text-xs"
                        title="Edit message"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                    {/if}
                    
                    <button
                      onclick={() => forkConversation(message.id)}
                      class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded text-xs"
                      title="Fork conversation"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2"></path>
                      </svg>
                    </button>
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
          <div class="flex justify-start" in:fly={{ y: 20, duration: 300 }}>
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
          <div class="flex justify-center" in:fly={{ y: 20, duration: 300 }}>
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 shadow-sm">
              <p class="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          </div>
        {/if}
      </div>
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
          Press Enter to send, Shift+Enter for new line • Click any message to fork the conversation
        </p>
      </div>
    </div>
  </div>
</div>
