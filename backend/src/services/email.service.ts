// backend/src/services/email.service.ts
import { initializeChatModel, emailPromptTemplate } from '../config/langchain.config';

export interface EmailGenerationRequest {
  prompt: string;
  tone: string;
  audience: string;
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
      // console.log('✅ Chat model initialized successfully');
    } catch (error) {
      // console.error('❌ Failed to initialize chat model');
      this.chatModel = null;
    }
  }

  async generateEmail(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
    try {
      if (!request.prompt || typeof request.prompt !== 'string' || !request.prompt.trim()) {
        return {
          success: false,
          error: 'Invalid request'
        };
      }

      if (!request.tone || typeof request.tone !== 'string' || !request.tone.trim()) {
        return {
          success: false,
          error: 'Invalid request'
        };
      }

      if (!request.audience || typeof request.audience !== 'string' || !request.audience.trim()) {
        return {
          success: false,
          error: 'Invalid request'
        };
      }

      if (!this.chatModel) {
        return {
          success: false,
          error: 'Service unavailable'
        };
      }

      const formattedPrompt = await emailPromptTemplate.format({
        prompt: request.prompt,
        tone: request.tone,
        audience: request.audience
      });

      // console.log(`📧 Generating email - Tone: ${request.tone}, Audience: ${request.audience}`);

      const response = await this.chatModel.invoke(formattedPrompt);
      
      const emailContent =
        typeof response.content === 'string'
          ? response.content
          : response.content.toString();

      // console.log('✅ Email generated successfully');

      return {
        success: true,
        email: emailContent.trim(),
        metadata: {
          tone: request.tone,
          audience: request.audience,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      // console.error('❌ Error generating email');
      return {
        success: false,
        error: 'An error occurred while generating the email'
      };
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.chatModel) {
        return false;
      }
      const testResponse = await this.chatModel.invoke('Test');
      return !!testResponse;
    } catch {
      // console.error('API Key validation failed');
      return false;
    }
  }
}

export default new EmailService();
