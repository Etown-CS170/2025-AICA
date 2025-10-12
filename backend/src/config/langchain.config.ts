import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

// Initialize OpenAI model
export const initializeChatModel = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

  return new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000
  });
};

// Email generation prompt template
export const emailPromptTemplate = PromptTemplate.fromTemplate(`
You are AICA, an AI Communication Assistant specializing in professional email composition.

Generate a complete, professional email based on the following parameters:

USER REQUEST: {prompt}
TONE: {tone}
RECIPIENT TYPE: {audience}

TONE GUIDELINES:
- Professional: Clear, direct, business-appropriate language
- Friendly: Warm, approachable, conversational while maintaining professionalism
- Formal: Respectful, structured, traditional business communication
- Persuasive: Compelling, action-oriented, emphasizes benefits and outcomes

AUDIENCE CONTEXT:
- Professor: Use "Dear Dr. [Last Name]", academic and respectful tone
- Student: Use "Hi [First Name]", casual but professional
- Coach: Use "Coach [Last Name]", respectful and direct
- Professional: Use "Dear [Mr./Ms. Last Name]", business-appropriate

IMPORTANT INSTRUCTIONS:
1. Generate a complete email with Subject line
2. Use appropriate greeting based on audience type
3. Keep the email concise (3-4 paragraphs maximum)
4. Include a clear call-to-action or next step when appropriate
5. Use appropriate closing based on tone
6. Include signature placeholder "[Your Name]"
7. Make the content contextually relevant to the user's request
8. Adapt formality level based on both tone and audience

FORMAT:
Subject: [Clear, concise subject line]

[Greeting] [Recipient placeholder],

[Email body - 2-3 paragraphs]

[Closing],
[Your Name]

Generate the email now:
`);