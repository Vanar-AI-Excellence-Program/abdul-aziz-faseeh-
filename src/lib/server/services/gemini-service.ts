import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import { ChatHistoryService } from './chat-history-service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Use gemini-1.5-flash as primary (better free tier support)
    try {
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
      console.log('✅ Gemini AI 1.5 Flash initialized successfully!');
    } catch (error) {
      try {
        this.model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-pro',
        });
        console.log('✅ Gemini AI 1.5 Pro initialized successfully!');
      } catch (error2) {
        this.model = this.genAI.getGenerativeModel({
          model: 'gemini-pro',
        });
        console.log('✅ Gemini AI Pro initialized successfully!');
      }
    }
  }

  /**
   * General AI response - ALWAYS calls Gemini API
   */
  async sendMessage(message: string, sessionId?: string): Promise<string> {
    try {
      const chat = this.model.startChat({
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.8,
          topP: 0.9,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      // Store messages if sessionId provided
      if (sessionId) {
        await ChatHistoryService.storeMessage(sessionId, 'user', message);
        await ChatHistoryService.storeMessage(sessionId, 'assistant', text);
      }

      return text;
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      
      // Only one fallback message for any API failure
      return "I'm having trouble generating a response right now. Please try again in a moment.";
    }
  }

  /**
   * Streaming responses - ALWAYS calls Gemini API
   */
  async streamResponse(
    message: string,
    controller: ReadableStreamDefaultController,
    sessionId: string,
    contextMessages?: ChatMessage[]
  ): Promise<void> {
    try {
      // Start a chat session with history if available
      const chat = this.model.startChat({
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.8,
          topP: 0.9,
        },
      });

      // Feed previous context if available
      if (contextMessages && contextMessages.length > 0) {
        for (const msg of contextMessages) {
          await chat.sendMessage(msg.content);
        }
      }

      // Stream the new message
      const result = await chat.sendMessageStream(message);
      let fullResponse = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;

        // Stream the chunk to the client
        controller.enqueue(new TextEncoder().encode(chunkText));

        // Small delay for smooth streaming effect
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Store the complete conversation
      await ChatHistoryService.storeMessage(sessionId, 'user', message);
      await ChatHistoryService.storeMessage(sessionId, 'assistant', fullResponse);
      
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      
      // Only one fallback message for any API failure
      controller.enqueue(new TextEncoder().encode("I'm having trouble generating a response right now. Please try again in a moment."));
    } finally {
      controller.close();
    }
  }
}

export const geminiService = new GeminiService();
