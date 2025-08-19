import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geminiService } from '$lib/server/services/gemini-service';
import { ChatHistoryService } from '$lib/server/services/chat-history-service';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, sessionId, editedMessageId, parentMessageId } = await request.json();

    if (!message || typeof message !== 'string') {
      return json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create a chat session for the user
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      // Create a new session for this conversation
      currentSessionId = await ChatHistoryService.createNewSession(session.user.id, message.substring(0, 50) + (message.length > 50 ? '...' : ''));
    }
    
    // If this is an edited message, we don't store it again (it was already updated via the PUT endpoint)
    if (!editedMessageId) {
      // Store the user message with the user's name and parent message ID
      await ChatHistoryService.storeMessage(currentSessionId, 'user', message, session.user.name, parentMessageId);
    }

    // Create a ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let assistantResponse = '';
          
          // Send session ID as first chunk so frontend knows which session this is
          const sessionInfo = JSON.stringify({ sessionId: currentSessionId, type: 'session_info' }) + '\n';
          controller.enqueue(new TextEncoder().encode(sessionInfo));
          
          // Create a custom stream controller that captures the full response
          const customController = {
            enqueue: (chunk: Uint8Array) => {
              const text = new TextDecoder().decode(chunk);
              assistantResponse += text;
              controller.enqueue(chunk);
            },
            close: () => {
              // Store the complete assistant response
              if (assistantResponse.trim()) {
                ChatHistoryService.storeMessage(currentSessionId, 'assistant', assistantResponse.trim())
                  .catch(error => console.error('Failed to store assistant message:', error));
              }
              controller.close();
            },
            error: (error: any) => {
              controller.error(error);
            }
          };
          
          // If this is an edited message, get the conversation context up to that message
          let contextMessages: any[] = [];
          if (editedMessageId) {
            try {
              // Get the conversation branch up to the edited message
              contextMessages = await ChatHistoryService.getConversationBranch(editedMessageId, session.user.id);
            } catch (error) {
              console.error('Error getting context messages:', error);
            }
          } else if (parentMessageId) {
            try {
              // Get the conversation branch up to the parent message
              contextMessages = await ChatHistoryService.getConversationBranch(parentMessageId, session.user.id);
            } catch (error) {
              console.error('Error getting context messages:', error);
            }
          }
          
          // Stream the response using the Gemini service
          await geminiService.streamResponse(message, customController, currentSessionId, contextMessages);
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Chat stream API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
