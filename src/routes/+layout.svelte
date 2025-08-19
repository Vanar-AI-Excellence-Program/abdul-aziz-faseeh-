<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { page } from '$app/stores';

	let { children, data } = $props();
	let { session } = data;
	
	// Check if we're on the chatbot page
	let isChatbotPage = $derived($page.url.pathname === '/dashboard/chatbot');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Authentication App</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-gray-50">
	{#if !isChatbotPage}
		<Navbar {session} />
	{/if}
	<main class="flex-1 container mx-auto px-4 py-8 sm:px-6 lg:px-8 {isChatbotPage ? 'p-0 max-w-none' : ''}">
		{@render children?.()}
	</main>
	{#if !isChatbotPage}
		<footer class="bg-white border-t border-gray-200 py-6">
			<div class="container mx-auto px-4 sm:px-6 lg:px-8">
				<p class="text-center text-sm text-gray-500">
					© {new Date().getFullYear()} Authentication App. All rights reserved.
				</p>
			</div>
		</footer>
	{/if}
</div>
