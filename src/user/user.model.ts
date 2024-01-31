// user.model.ts

import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String }, // Assuming profileImage is a URL
  // Add other properties as needed
});

export interface User extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  profileImage?: string; // Optional profile image URL
  // Add other properties as needed
}

export const UserModel = mongoose.model<User>('User', UserSchema);
