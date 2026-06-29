import {Request} from 'express';

export interface User{
    id: string;
    email: string;
    password_hash: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}