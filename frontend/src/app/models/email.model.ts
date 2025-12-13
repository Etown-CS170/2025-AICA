export interface EmailRequest {
  prompt: string;
  tone: string;
  audience: string;
}

export interface EmailResponse {
  success: boolean;
  email?: string;
  metadata?: {
    tone: string;
    audience: string;
    timestamp: string;
  };
  error?: string;
}

export type ToneType = 'professional' | 'friendly' | 'formal' | 'persuasive';
export type AudienceType = 'professor' | 'student' | 'coach' | 'professional';

export interface Tone {
  id: string;
  label: string;
  color: string;
  description?: string;
}

export interface Audience {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  prompt: string;
  isCustom?: boolean;
}

export interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  tone?: string;
  audience?: string;
  signature?: string;
  timestamp: Date;
}

export interface Signature {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}