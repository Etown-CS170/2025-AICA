import { Schema, model, Document } from 'mongoose';

export interface IOutlookTokens extends Document {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const OutlookTokensSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

export const OutlookTokens = model<IOutlookTokens>('OutlookTokens', OutlookTokensSchema);