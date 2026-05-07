/**
 * Utility for interacting with OpenAI API
 * Provides role-based context for health agents
 */

// Get the API key from environment variables
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Interface for OpenAI API request
 */
interface OpenAIRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

/**
 * Interface for OpenAI API response
 */
interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    total_tokens: number;
  };
}

/**
 * Generate a response from OpenAI
 * @param userPrompt The user's message
 * @param systemContext The system context/instructions
 * @param conversationHistory Optional conversation history for context
 * @returns The generated text response
 */
export const generateOpenAIResponse = async (
  userPrompt: string,
  systemContext: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> => {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return 'I apologize, but I am unable to process your request at the moment due to a configuration issue. Please try again later.';
    }

    // Prepare the messages array with proper typing
    type MessageRole = 'system' | 'user' | 'assistant';
    interface Message {
      role: MessageRole;
      content: string;
    }
    
    const messages: Message[] = [
      {
        role: 'system',
        content: systemContext
      }
    ];

    // Add conversation history if provided
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }

    // Add the current user prompt
    messages.push({
      role: 'user',
      content: userPrompt
    });

    const requestBody: OpenAIRequest = {
      model: 'gpt-4-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    // Make the API request
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return 'I apologize, but I encountered an error while processing your request. Please try again later.';
    }

    const data = await response.json() as OpenAIResponse;

    // Extract and clean the generated text
    if (data.choices && data.choices.length > 0) {
      const generatedText = data.choices[0].message.content;
      return cleanText(generatedText);
    }

    return 'I apologize, but I was unable to generate a response. Please try again with a different question.';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.';
  }
};

/**
 * Generate a response for image analysis from OpenAI
 * @param prompt The text prompt describing what to analyze
 * @param imageBase64 The base64-encoded image data
 * @returns The generated text response
 */
export const generateOpenAIImageAnalysis = async (
  prompt: string,
  imageBase64: string
): Promise<string> => {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return 'I apologize, but I am unable to process your image at the moment due to a configuration issue. Please try again later.';
    }

    // For image analysis, we need to use the vision model
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    // Extract the base64 data without the prefix (e.g., "data:image/jpeg;base64,")
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    // Prepare the request body for vision model
    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: base64Data
              }
            }
          ]
        }
      ],
      max_tokens: 1024
    };

    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return 'I apologize, but I encountered an error while analyzing your image. Please try again later.';
    }

    const data = await response.json();

    // Extract and clean the generated text
    if (data.choices && data.choices.length > 0) {
      const generatedText = data.choices[0].message.content;
      return cleanText(generatedText);
    }

    return 'I apologize, but I was unable to analyze the image. Please try again with a different image.';
  } catch (error) {
    console.error('Error calling OpenAI API for image analysis:', error);
    return 'I apologize, but I encountered an error while analyzing your image. Please try again later.';
  }
};

/**
 * Clean output text from AI responses
 * Removes special characters and formats the text for better readability
 */
export const cleanText = (text: string): string => {
  if (!text) return '';
  
  // Replace multiple newlines with a single newline
  let cleanedText = text.replace(/\n{3,}/g, '\n\n');
  
  // Remove any non-printable characters
  cleanedText = cleanedText.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Replace markdown bold/italic with plain text
  cleanedText = cleanedText.replace(/\*\*(.*?)\*\*/g, '$1');
  cleanedText = cleanedText.replace(/\*(.*?)\*/g, '$1');
  
  // Replace markdown bullet points with plain text bullet points
  cleanedText = cleanedText.replace(/^\s*[\*\-]\s+/gm, '• ');
  
  // Replace other common markdown elements
  cleanedText = cleanedText.replace(/^#+\s+/gm, ''); // Remove heading markers
  cleanedText = cleanedText.replace(/`([^`]+)`/g, '$1'); // Remove code ticks
  cleanedText = cleanedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Replace links with just text
  
  // Remove any disclaimer sections
  cleanedText = cleanedText.replace(/Disclaimer:?.*?(\n|$)/gi, '');
  cleanedText = cleanedText.replace(/I am an AI.*?(\n|$)/gi, '');
  cleanedText = cleanedText.replace(/This analysis is based.*?(\n|$)/gi, '');
  cleanedText = cleanedText.replace(/As an AI,?.*?(\n|$)/gi, '');
  
  return cleanedText.trim();
};
