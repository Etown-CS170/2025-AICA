import { Schema, model, Document } from 'mongoose';

export interface ITone {
  id: string;
  label: string;
  color: string;
  description?: string;
}

export interface IAudience {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

export interface ITemplate {
  id: string;
  name: string;
  prompt: string;
  isCustom?: boolean;
}

export interface ISavedEmail {
  id: string;
  subject: string;
  content: string;
  tone: string;
  audience: string;
  timestamp: Date;
  source: 'ai' | 'manual';
  isFavorite?: boolean;
}

export interface ISignature {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}

export interface IUserPreferencesDoc {
  userId: string; // Auth0 user ID
  tones: ITone[];
  audiences: IAudience[];
  templates: ITemplate[];
  savedEmails: ISavedEmail[];
  signatures: ISignature[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserPreferences extends IUserPreferencesDoc, Document {}

const ToneSchema = new Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  color: { type: String, required: true },
  description: { type: String }
});

const AudienceSchema = new Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String }
});

const TemplateSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  prompt: { type: String, required: true },
  isCustom: { type: Boolean, default: false }
});

const SavedEmailSchema = new Schema({
  id: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  tone: { type: String, required: true },
  audience: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  source: { type: String, enum: ['ai', 'manual'], required: true },
  isFavorite: { type: Boolean, default: false }
});

const SignatureSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const UserPreferencesSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  tones: { type: [ToneSchema], default: [] },
  audiences: { type: [AudienceSchema], default: [] },
  templates: { type: [TemplateSchema], default: [] },
  savedEmails: { type: [SavedEmailSchema], default: [] },
  signatures: { type: [SignatureSchema], default: [] }
}, {
  timestamps: true
});

export const UserPreferences = model<IUserPreferences>('UserPreferences', UserPreferencesSchema);