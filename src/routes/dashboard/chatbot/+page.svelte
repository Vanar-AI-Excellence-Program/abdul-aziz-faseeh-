<script lang="ts">
  import ChatbotDashboard from '$lib/components/ChatbotDashboard.svelte';

  let { data } = $props();
  let { session } = data;
</script>

<svelte:head>
  <title>AI Chatbot | Dashboard</title>
</svelte:head>

<ChatbotDashboard {session} />
