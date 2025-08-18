import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async () => {
  try {
    const hasApiKey = !!GEMINI_API_KEY;
    const apiKeyLength = GEMINI_API_KEY ? GEMINI_API_KEY.length : 0;
    const apiKeyPreview = GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'Not set';
    
    return json({
      hasApiKey,
      apiKeyLength,
      apiKeyPreview,
      message: hasApiKey 
        ? 'Gemini API key is configured' 
        : 'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.'
    });
  } catch (error) {
    return json({
      error: 'Failed to check environment configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
