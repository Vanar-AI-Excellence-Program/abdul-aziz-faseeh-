# Modern Chatbot Dashboard

A modern, responsive chatbot dashboard built with SvelteKit and TailwindCSS, designed to provide a ChatGPT-like experience.

## Features

### 🎨 Modern UI/UX
- **ChatGPT-style Interface**: Clean, minimal design similar to OpenAI's ChatGPT
- **Dark/Light Mode**: Toggle between dark and light themes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Smooth Animations**: Framer Motion-style animations using Svelte transitions

### 💬 Chat Features
- **Real-time Streaming**: Messages stream in real-time as the AI responds
- **Enhanced Markdown Support**: 
  - **Bold** and *italic* text
  - `Inline code` and ```code blocks```
  - Lists (bullet points and numbered)
  - Headers (# H1, ## H2, ### H3)
  - Links [text](url)
- **Auto-resize Textarea**: Input field automatically adjusts height
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line
- **Message History**: Persistent chat history with timestamps

### 🧭 Navigation & Layout
- **Collapsible Sidebar**: 
  - App logo and branding
  - Navigation items (New Chat, Dashboard, Profile)
  - User profile with avatar
  - Dark mode toggle
- **Mobile-friendly**: Hamburger menu for mobile devices
- **Chat Management**: Clear chat functionality

### 🎯 Technical Features
- **TypeScript**: Full type safety
- **TailwindCSS**: Utility-first styling with dark mode support
- **SvelteKit**: Modern web framework
- **Custom Components**: Reusable UI components
- **Auto-scroll**: Messages automatically scroll to bottom
- **Loading States**: Smooth loading animations

## Components

### Core Components
- `ChatbotDashboard.svelte` - Main dashboard component
- `AutoResizeTextarea.svelte` - Auto-resizing text input
- `LoadingDots.svelte` - Loading animation component

### Utility Functions
- `markdown.ts` - Enhanced markdown processing
- `formatMarkdown()` - Converts markdown to HTML
- `sanitizeHtml()` - Basic HTML sanitization

## Usage

### Basic Setup
```svelte
<script>
  import ChatbotDashboard from '$lib/components/ChatbotDashboard.svelte';
  
  let session = { user: { name: 'John Doe', email: 'john@example.com' } };
</script>

<ChatbotDashboard {session} />
```

### Customization
The dashboard can be customized by modifying:
- Color scheme in TailwindCSS config
- Markdown processing in `markdown.ts`
- Component styling in individual Svelte files
- Animation timing in transition properties

## API Integration

The dashboard connects to existing API endpoints:
- `POST /api/chat/stream` - Streaming chat responses
- `GET /api/chat/history` - Chat history retrieval

## Styling

### Dark Mode
Dark mode is implemented using TailwindCSS's `dark:` prefix and the `dark` class on the HTML element.

### Custom Scrollbar
Custom scrollbar styling is included for better visual consistency.

### Typography
Enhanced typography support for markdown content with proper spacing and styling.

## Browser Support

- Modern browsers with ES6+ support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Performance

- Efficient message rendering with Svelte's reactive system
- Optimized animations using CSS transitions
- Minimal bundle size with tree-shaking
- Lazy loading of components where appropriate

## Future Enhancements

- File upload support
- Voice input/output
- Chat session management
- Export chat history
- Custom themes
- Accessibility improvements
- Offline support
