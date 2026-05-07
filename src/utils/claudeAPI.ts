/**
 * Utility for interacting with Anthropic Claude API via server-side API routes
 * Provides role-based context for health agents
 */

// Use internal API routes instead of direct API calls to avoid CORS issues
const CLAUDE_TEXT_API_ROUTE = '/api/claude';
const CLAUDE_IMAGE_API_ROUTE = '/api/claude';

/**
 * Interface for Claude API response from our server-side API route
 */
interface ClaudeAPIResponse {
  text?: string;
  error?: string;
}

/**
 * Interface for Claude API response
 */
interface ClaudeResponse {
  content: {
    type: string;
    text: string;
  }[];
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  type: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Generate a response from Claude
 * @param userPrompt The user's message
 * @param systemContext The system context/instructions
 * @param conversationHistory Optional conversation history for context
 * @returns The generated text response
 */
export const generateClaudeResponse = async (
  userPrompt: string,
  systemContext: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> => {
  try {
    // Prepare the request payload for our API route
    const requestPayload = {
      prompt: userPrompt,
      systemContext,
      conversationHistory
    };

    // Make the API request to our internal API route
    const response = await fetch(CLAUDE_TEXT_API_ROUTE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);
      return 'I apologize, but I encountered an error while processing your request. Please try again later.';
    }

    const data = await response.json() as ClaudeAPIResponse;
    
    // Check for error in the response
    if (data.error) {
      console.error('Claude API returned an error:', data.error);
      return `I apologize, but I encountered an error: ${data.error}. Please try again later.`;
    }

    // Return the generated text
    if (data.text) {
      return data.text; // Text is already cleaned in the API route
    }

    return 'I apologize, but I was unable to generate a response. Please try again with a different question.';
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.';
  }
};

/**
 * Generate a response for image analysis from Claude
 * @param prompt The text prompt describing what to analyze
 * @param imageBase64 The base64-encoded image data
 * @returns The generated text response
 */
export const generateClaudeImageAnalysis = async (
  prompt: string,
  imageBase64: string
): Promise<string> => {
  try {
    // Prepare the request payload for our API route
    const requestPayload = {
      prompt,
      imageBase64
    };

    // Make the API request to our internal API route
    const response = await fetch(CLAUDE_IMAGE_API_ROUTE, {
      method: 'PUT', // Using PUT for image analysis to differentiate from text completion
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);
      return 'I apologize, but I encountered an error while processing your image. Please try again later.';
    }

    const data = await response.json() as ClaudeAPIResponse;
    
    // Check for error in the response
    if (data.error) {
      console.error('Claude API returned an error for image analysis:', data.error);
      return `I apologize, but I encountered an error analyzing your image: ${data.error}. Please try again later.`;
    }

    // Return the generated text
    if (data.text) {
      return data.text; // Text is already cleaned in the API route
    }

    return 'I apologize, but I was unable to analyze the image. Please try again with a different image.';
  } catch (error) {
    console.error('Error calling Claude API for image analysis:', error);
    return 'I apologize, but I encountered an error while processing your image. Please try again later.';
  }
};

/**
 * Clean output text from AI responses
 * Removes special characters and formats the text for better readability
 */
export const cleanText = (text: string): string => {
  // Remove any markdown code block syntax
  let cleanedText = text.replace(/```[\s\S]*?```/g, '');
  
  // Remove excessive newlines
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  cleanedText = cleanedText.trim();
  
  return cleanedText;
};
