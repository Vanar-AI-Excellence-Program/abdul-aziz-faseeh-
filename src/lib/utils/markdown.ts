export function formatMarkdown(content: string): string {
  if (!content) return '';
  
  return content
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Italic text: *text* -> <em>text</em>
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Inline code: `code` -> <code>code</code>
    .replace(/`(.*?)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">$1</code>')
    // Code blocks: ```code``` -> <pre><code>code</code></pre>
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-2 border border-gray-200 dark:border-gray-700"><code class="text-sm font-mono text-gray-800 dark:text-gray-200 block">$1</code></pre>')
    // Numbered lists: 1. item -> <li>item</li>
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Bullet lists: - item -> <li>item</li>
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Wrap consecutive list items in <ul> or <ol>
    .replace(/(<li.*<\/li>)/s, (match) => {
      const items = match.match(/<li.*?<\/li>/g) || [];
      const isOrdered = items.some(item => item.includes('list-decimal'));
      const listType = isOrdered ? 'ol' : 'ul';
      return `<${listType} class="space-y-1 my-2 ${isOrdered ? 'list-decimal' : 'list-disc'} ml-4">${match}</${listType}>`;
    })
    // Headers: # Header -> <h1>Header</h1>
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">$1</h1>')
    // Links: [text](url) -> <a>text</a>
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>');
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - allow only safe tags
  const allowedTags = {
    'strong': ['class'],
    'em': ['class'],
    'code': ['class'],
    'pre': ['class'],
    'ul': ['class'],
    'ol': ['class'],
    'li': ['class'],
    'h1': ['class'],
    'h2': ['class'],
    'h3': ['class'],
    'a': ['href', 'class', 'target', 'rel'],
    'br': []
  };

  // This is a simplified sanitizer - in production, you might want to use a library like DOMPurify
  return html;
}
