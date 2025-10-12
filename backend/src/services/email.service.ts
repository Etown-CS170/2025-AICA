import { initializeChatModel, emailPromptTemplate } from '../config/langchain.config';

export interface EmailGenerationRequest {
  prompt: string;
  tone: 'professional' | 'friendly' | 'formal' | 'persuasive';
  audience: 'professor' | 'student' | 'coach' | 'professional';
}

export interface EmailGenerationResponse {
  success: boolean;
  email?: string;
  metadata?: {
    tone: string;
    audience: string;
    timestamp: string;
  };
  error?: string;
}

class EmailService {
  private chatModel: any;

  constructor() {
    try {
      this.chatModel = initializeChatModel();
      console.log('✅ Chat model initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize chat model:', error);
      this.chatModel = null;
    }
  }

  async generateEmail(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
    try {
      // Validate input
      if (!request.prompt || request.prompt.trim().length === 0) {
        return {
          success: false,
          error: 'Prompt cannot be empty'
        };
      }

      if (!this.chatModel) {
        throw new Error('Chat model not initialized. Please check your OpenAI API key.');
      }

      // Format the prompt
      const formattedPrompt = await emailPromptTemplate.format({
        prompt: request.prompt,
        tone: request.tone,
        audience: request.audience
      });

      console.log(`📧 Generating email - Tone: ${request.tone}, Audience: ${request.audience}`);

      // Generate email using LangChain
      const response = await this.chatModel.invoke(formattedPrompt);
      
      // Extract the content from the response
      const emailContent = typeof response.content === 'string' 
        ? response.content 
        : response.content.toString();

      console.log('✅ Email generated successfully');

      // Return successful response
      return {
        success: true,
        email: emailContent.trim(),
        metadata: {
          tone: request.tone,
          audience: request.audience,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error: any) {
      console.error('❌ Error generating email:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to generate email'
      };
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.chatModel) {
        return false;
      }
      
      // Simple test call
      const testResponse = await this.chatModel.invoke('Test');
      return !!testResponse;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  }
}

export default new EmailService();