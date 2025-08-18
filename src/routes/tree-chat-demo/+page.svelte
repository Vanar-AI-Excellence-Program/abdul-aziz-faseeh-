<script lang="ts">
  import { onMount } from 'svelte';
  import TreeChatDashboard from '$lib/components/TreeChatDashboard.svelte';

  let session = {
    user: {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com'
    }
  };
</script>

<svelte:head>
  <title>Tree Chat Demo | Conversation Branching</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <TreeChatDashboard {session} />
</div>
