import { NextRequest, NextResponse } from 'next/server';

// Get the API key from environment variables
// Make sure to use the exact key format from the .env file
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Log the API key (first few characters) for debugging
console.log('Claude API Key available:', CLAUDE_API_KEY ? `${CLAUDE_API_KEY.substring(0, 10)}...` : 'No key found');

/**
 * API route for Claude text completions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { prompt, systemContext, conversationHistory } = await request.json();

    if (!CLAUDE_API_KEY) {
      console.error('Claude API key not found');
      return NextResponse.json(
        { error: 'API key configuration error' },
        { status: 500 }
      );
    }

    // Prepare the messages array
    const messages = [...(conversationHistory || [])];
    
    // Add the current user prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    const requestBody = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages,
      system: systemContext,
      temperature: 0.7,
      top_p: 0.95
    };

    console.log('Making Claude API request with key starting with:', CLAUDE_API_KEY?.substring(0, 10));
    
    // Make the API request
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Claude API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);
      return NextResponse.json(
        { error: 'Error calling Claude API' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract the generated text
    if (data.content && data.content.length > 0) {
      const generatedText = data.content[0].text;
      return NextResponse.json({ text: cleanText(generatedText) });
    }

    return NextResponse.json(
      { error: 'No response generated' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in Claude API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API route for Claude image analysis
 */
export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    const { prompt, imageBase64 } = await request.json();

    if (!CLAUDE_API_KEY) {
      console.error('Claude API key not found');
      return NextResponse.json(
        { error: 'API key configuration error' },
        { status: 500 }
      );
    }

    // Extract the base64 data without the prefix (e.g., "data:image/jpeg;base64,")
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1]
      : imageBase64;
    
    const mimeType = imageBase64.includes('data:')
      ? imageBase64.split(';')[0].split(':')[1]
      : 'image/jpeg';

    // Create the message with image content
    const message = {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: base64Data
          }
        },
        {
          type: 'text',
          text: prompt
        }
      ]
    };

    const requestBody = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [message],
      temperature: 0.7
    };

    console.log('Making Claude API request with key starting with:', CLAUDE_API_KEY?.substring(0, 10));
    
    // Make the API request
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Claude API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);
      return NextResponse.json(
        { error: 'Error calling Claude API for image analysis' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract the generated text
    if (data.content && data.content.length > 0) {
      const generatedText = data.content[0].text;
      return NextResponse.json({ text: cleanText(generatedText) });
    }

    return NextResponse.json(
      { error: 'No response generated for image analysis' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in Claude image analysis API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Clean output text from AI responses
 */
function cleanText(text: string): string {
  // Remove any markdown code block syntax
  let cleanedText = text.replace(/```[\s\S]*?```/g, '');
  
  // Remove excessive newlines
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  cleanedText = cleanedText.trim();
  
  return cleanedText;
}
