export interface EmailRequest {
  prompt: string;
  tone: string; // Changed from ToneType to allow custom values
  audience: string; // Changed from AudienceType to allow custom values
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
  id: string; // Changed from ToneType to string to allow custom IDs
  label: string;
  color: string;
  description?: string;
}

export interface Audience {
  id: string; // Changed from AudienceType to string to allow custom IDs
  label: string;
  icon: string;
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  prompt: string;
  isCustom?: boolean; // Added to identify custom templates
}

export interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  tone?: string;
  audience?: string;
  signature?: string;  // NEW: Add this line
  timestamp: Date;
}

export interface Signature {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}