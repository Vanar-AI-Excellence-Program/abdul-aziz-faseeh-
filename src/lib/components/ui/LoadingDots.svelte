<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let color: 'gray' | 'blue' | 'white' = 'gray';
  
  $: sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }[size];
  
  $: colorClasses = {
    gray: 'bg-gray-400 dark:bg-gray-500',
    blue: 'bg-blue-500 dark:bg-blue-400',
    white: 'bg-white'
  }[color];
</script>

<div class="flex space-x-1">
  <div class="{sizeClasses} {colorClasses} rounded-full animate-bounce"></div>
  <div class="{sizeClasses} {colorClasses} rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
  <div class="{sizeClasses} {colorClasses} rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
</div>
