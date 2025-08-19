import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import { ChatHistoryService } from './chat-history-service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null;
  private model: any;
  private chat: any;

  constructor() {
    console.log('🔍 Gemini Service Debug:');
    console.log('- GEMINI_API_KEY imported:', !!GEMINI_API_KEY);
    console.log('- API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
    
    if (!GEMINI_API_KEY) {
      console.warn('❌ GEMINI_API_KEY not found in environment variables. Using intelligent fallback responses.');
      console.warn('Please make sure your .env file contains: GEMINI_API_KEY=your-api-key');
      this.genAI = null;
      this.model = null;
      this.chat = null;
    } else {
      console.log('✅ GEMINI_API_KEY found. Initializing Gemini AI...');
      try {
        this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        this.chat = this.model.startChat({
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.9,
          },
        });
        console.log('✅ Gemini AI initialized successfully!');
      } catch (error) {
        console.error('❌ Error initializing Gemini AI:', error);
        this.genAI = null;
        this.model = null;
        this.chat = null;
      }
    }
  }

  async sendMessage(message: string): Promise<string> {
    console.log('🔍 sendMessage called with:', message);
    
    try {
      // If no API key is configured, return a helpful message
      if (!this.genAI || !this.chat) {
        console.log('❌ No Gemini AI initialized');
        return `Hello! I'm your AI assistant. I can help you with various tasks like answering questions, providing information, helping with coding, writing, analysis, and more. 

What would you like to know about? I'm here to help!`;
      }

      console.log('✅ Sending message to Gemini API...');
      
      // Send message directly to Gemini API
      const result = await this.chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Received response from Gemini');
      
      return text;
      
    } catch (error) {
      console.error('❌ Error calling Gemini API:', error);
      
      // Use the intelligent response generator
      return this.generateIntelligentResponse(message);
    }
  }

  async sendMessageStream(message: string): Promise<string> {
    return this.sendMessage(message);
  }

  async streamResponse(message: string, controller: ReadableStreamDefaultController, sessionId: string, contextMessages?: ChatMessage[]): Promise<void> {
    try {
      // If no API key, return helpful message
      if (!this.genAI || !this.chat) {
        console.log('❌ No Gemini AI initialized');
        const welcomeMessage = `Hello! I'm your AI assistant. I can help you with various tasks like answering questions, providing information, helping with coding, writing, analysis, and more. 

What would you like to know about? I'm here to help!`;
        controller.enqueue(new TextEncoder().encode(welcomeMessage));
        return;
      }

      console.log('✅ Starting Gemini API streaming...');
      
      // If we have context messages, we need to restart the chat with the conversation history
      if (contextMessages && contextMessages.length > 0) {
        // Create a new chat instance with the conversation history
        const newChat = this.model.startChat({
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.9,
          },
        });

        // Send all previous messages to establish context
        for (const msg of contextMessages) {
          if (msg.role === 'user') {
            await newChat.sendMessage(msg.content);
          }
        }

        // Now send the current message
        const result = await newChat.sendMessageStream(message);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          
          // Send chunk to client
          controller.enqueue(new TextEncoder().encode(chunkText));
          
          // Add small delay for natural typing effect
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        // Store the final response in database
        await ChatHistoryService.storeMessage(sessionId, 'assistant', fullResponse);
      } else {
        // Original behavior for new conversations
        const result = await this.chat.sendMessageStream(message);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          
          // Send chunk to client
          controller.enqueue(new TextEncoder().encode(chunkText));
          
          // Add small delay for natural typing effect
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        // Store the final response in database
        await ChatHistoryService.storeMessage(sessionId, 'assistant', fullResponse);
      }
      
    } catch (error) {
      console.error('❌ Error in streaming:', error);
      
      // Use the intelligent response generator
      const fallbackResponse = this.generateIntelligentResponse(message);
      controller.enqueue(new TextEncoder().encode(fallbackResponse));
    } finally {
      controller.close();
    }
  }

  private generateIntelligentResponse(message: string): string {
    const lowerMessage = message.toLowerCase().trim();
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm your AI assistant. How can I help you today? I can assist with questions, provide information, help with coding, writing, analysis, and much more.";
    }
    
    // Help requests
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return "I'm here to help! I can assist with:\n\n• Answering questions and providing information\n• Helping with programming and coding\n• Writing assistance and content creation\n• Data analysis and problem-solving\n• General knowledge and explanations\n• Creative tasks and brainstorming\n\nWhat would you like to work on?";
    }
    
    // Programming questions
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('javascript') || lowerMessage.includes('python') || lowerMessage.includes('html') || lowerMessage.includes('css')) {
      return "I can help you with programming! I'm knowledgeable about many programming languages and frameworks. What specific coding question do you have? I can help with:\n\n• Syntax and best practices\n• Debugging and problem-solving\n• Code reviews and improvements\n• Algorithm explanations\n• Framework-specific questions\n\nWhat language or framework are you working with?";
    }
    
    // Weather questions
    if (lowerMessage.includes('weather')) {
      return "I'd be happy to help with weather information! However, I don't have access to real-time weather data. For current weather conditions, I recommend checking:\n\n• Weather apps on your device\n• Weather websites like weather.com\n• Local weather services\n\nIs there anything else I can help you with?";
    }
    
    // Math questions
    if (lowerMessage.includes('math') || lowerMessage.includes('calculate') || lowerMessage.includes('equation')) {
      return "I can help with mathematical questions! I can assist with:\n\n• Basic arithmetic and calculations\n• Algebra and equations\n• Geometry and trigonometry\n• Statistics and probability\n• Mathematical concepts and explanations\n\nWhat specific math problem would you like help with?";
    }
    
    // Writing assistance
    if (lowerMessage.includes('write') || lowerMessage.includes('essay') || lowerMessage.includes('content') || lowerMessage.includes('story')) {
      return "I can help you with writing! I can assist with:\n\n• Essay writing and structure\n• Content creation and editing\n• Creative writing and storytelling\n• Business writing and emails\n• Grammar and style improvements\n\nWhat type of writing would you like help with?";
    }
    
    // General questions
    if (lowerMessage.includes('what is') || lowerMessage.includes('how to') || lowerMessage.includes('explain')) {
      return `I understand you're asking about "${message}". I'm here to help with your questions and provide useful information. Could you please provide more details about what you'd like to know? I can help with explanations, step-by-step guides, and detailed information on various topics.`;
    }
    
    // Default response
    return `I understand you're asking about "${message}". I'm your AI assistant and I'm here to help with your questions, provide information, assist with tasks, and engage in meaningful conversations. 

Could you please provide more details about what you'd like to know or how I can help you? I'm knowledgeable about many topics and happy to assist!`;
  }
}

export const geminiService = new GeminiService();
