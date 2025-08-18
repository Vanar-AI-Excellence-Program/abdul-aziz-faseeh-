<script lang="ts">
  import { onMount } from 'svelte';
  
  export let value = '';
  export let placeholder = '';
  export let disabled = false;
  export let rows = 1;
  export let maxRows = 6;
  
  let textarea: HTMLTextAreaElement;
  
  function adjustHeight() {
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const maxHeight = lineHeight * maxRows;
    
    // Set the new height
    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
  }
  
  $: if (value !== undefined) {
    adjustHeight();
  }
  
  onMount(() => {
    adjustHeight();
  });
</script>

<textarea
  bind:this={textarea}
  bind:value
  {placeholder}
  {disabled}
  {rows}
  class="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
  oninput={adjustHeight}
  {...$$restProps}
></textarea>
