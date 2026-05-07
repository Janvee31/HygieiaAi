/**
 * Utility for interacting with Google's Gemini AI API
 */

// Get the API key from environment variables
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Interface for Gemini API request
 */
interface GeminiRequest {
  contents: {
    role: string;
    parts: {
      text: string;
    }[];
  }[];
  generationConfig: {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  };
}

/**
 * Interface for Gemini API response
 */
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  promptFeedback?: {
    blockReason?: string;
  };
}

/**
 * Generate a response from Gemini AI
 * @param prompt The prompt to send to Gemini
 * @param systemContext Optional system context/instructions
 * @returns The generated text response
 */
export const generateGeminiResponse = async (
  prompt: string,
  systemContext?: string
): Promise<string> => {
  try {
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not found');
      return 'I apologize, but I am unable to process your request at the moment due to a configuration issue. Please try again later.';
    }

    // Construct the API URL with the API key
    const apiUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

    // Prepare the request body
    // Gemini doesn't support system role, so we'll incorporate the context into the user prompt
    let enhancedPrompt = prompt;
    if (systemContext) {
      enhancedPrompt = `${systemContext}

User query: ${prompt}`;
    }
    
    const contents = [
      {
        role: 'user',
        parts: [{ text: enhancedPrompt }]
      }
    ];

    const requestBody: GeminiRequest = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024
      }
    };

    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return 'I apologize, but I encountered an error while processing your request. Please try again later.';
    }

    const data = await response.json() as GeminiResponse;

    // Check if the response was blocked
    if (data.promptFeedback?.blockReason) {
      console.error('Gemini response blocked:', data.promptFeedback.blockReason);
      return 'I apologize, but I cannot provide a response to that query. Please try asking something else.';
    }

    // Extract the generated text and clean it
    if (data.candidates && data.candidates.length > 0) {
      const generatedText = data.candidates[0].content.parts[0].text;
      return cleanOutputText(generatedText);
    }

    return 'I apologize, but I was unable to generate a response. Please try again with a different question.';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.';
  }
};

/**
 * Generate a response for image analysis from Gemini AI
 * @param prompt The text prompt describing what to analyze
 * @param imageBase64 The base64-encoded image data
 * @returns The generated text response
 */
/**
 * Clean output text from Gemini API responses
 * Removes special characters and formats the text for better readability
 */
const cleanOutputText = (text: string): string => {
  if (!text) return '';
  
  // Replace multiple newlines with a single newline
  let cleanedText = text.replace(/\n{3,}/g, '\n\n');
  
  // Remove any non-printable characters
  cleanedText = cleanedText.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Replace markdown bold/italic with plain text
  cleanedText = cleanedText.replace(/\*\*(.*?)\*\*/g, '$1');
  cleanedText = cleanedText.replace(/\*(.*?)\*/g, '$1');
  
  // Replace markdown bullet points with plain text bullet points
  cleanedText = cleanedText.replace(/^\s*\*\s+/gm, '• ');
  
  // Replace other common markdown elements
  cleanedText = cleanedText.replace(/^#+\s+/gm, ''); // Remove heading markers
  cleanedText = cleanedText.replace(/`([^`]+)`/g, '$1'); // Remove code ticks
  cleanedText = cleanedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Replace links with just text
  
  // Remove any disclaimer sections
  cleanedText = cleanedText.replace(/Disclaimer:?.*?(\n|$)/gi, '');
  cleanedText = cleanedText.replace(/I am an AI.*?(\n|$)/gi, '');
  cleanedText = cleanedText.replace(/This analysis is based.*?(\n|$)/gi, '');
  
  return cleanedText.trim();
};

export const generateGeminiImageAnalysis = async (
  prompt: string,
  imageBase64: string
): Promise<string> => {
  try {
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not found');
      return 'I apologize, but I am unable to process your image at the moment due to a configuration issue. Please try again later.';
    }

    // For image analysis, we need to use the multimodal endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Extract the base64 data without the prefix (e.g., "data:image/jpeg;base64,")
    const base64Data = imageBase64.split(',')[1];
    
    // Prepare the request body for multimodal input
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg', // Adjust if needed based on image type
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024
      }
    };

    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return 'I apologize, but I encountered an error while analyzing your image. Please try again later.';
    }

    const data = await response.json() as GeminiResponse;

    // Check if the response was blocked
    if (data.promptFeedback?.blockReason) {
      console.error('Gemini response blocked:', data.promptFeedback.blockReason);
      return 'I apologize, but I cannot analyze this type of image. Please try uploading a different image.';
    }

    // Extract the generated text and clean it
    if (data.candidates && data.candidates.length > 0) {
      const generatedText = data.candidates[0].content.parts[0].text;
      return cleanOutputText(generatedText);
    }

    return 'I apologize, but I was unable to analyze the image. Please try again with a different image.';
  } catch (error) {
    console.error('Error calling Gemini API for image analysis:', error);
    return 'I apologize, but I encountered an error while analyzing your image. Please try again later.';
  }
};
