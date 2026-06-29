import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../db';
import { User } from '../types';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt';

const REFRESH_EXPIRES_IN_DAYS = 7;

function hashToken(token : string) : string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export async function registerUser(email: string, password: string, name: string){
    const existing = await pool.query('Select id from users where email = $1', [email]);
    if(existing.rows.length > 0){
        throw {status : 409, message : 'Email already registered'}
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query<User>(
        `Insert into users (email, password_hash, name)
        Values ($1, $2, $3)
        RETURNING id, email, name, created_at`,
        [email, passwordHash, name]
    );

    const user = result.rows[0]!;
    
    return issueTokens(user.id, user.email, user.name);
}

export async function loginUser(email: string, password: string){
    const result = await pool.query<User>('Select * from users where email = $1', [email]);
    const user = result.rows[0];

    if(!user){
        throw {status: 401, message: 'Email not registered'}
    }

    const isValid = bcrypt.compare(password, user.password_hash);

    if(!isValid){
        throw {status: 401, message: 'Password does not match'}
    }

    return issueTokens(user.id, user.email, user.name);
}

export async function refreshAccessToken(refreshToken : string){
    let payload;
    try{
        payload = verifyAccessToken(refreshToken);
    }catch {
        throw {status: 401, message: 'Invalid or expired refresh token'}
    }

    const tokenHash = hashToken(refreshToken);
    const result = await pool.query('Select * from refresh_tokens where token_hash = $1 AND expires_at > NOW()', [tokenHash]);

    if(result.rows.length === 0){
        throw { status: 401, message: 'Refresh token not found or expired'}
    }

    const accessToken = signAccessToken({ userId: payload.userId, email: payload.email});
    return accessToken;
}

export async function logoutUser(refreshToken: string){
    const tokenHash = hashToken(refreshToken);
    await pool.query('Delete from refresh_tokens where token_hash = $1', [tokenHash]);
}

async function issueTokens(userId: string, email: string, name: string){
    const accessToken = signAccessToken({ userId, email });
    const refreshToken = signRefreshToken({ userId, email });

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_IN_DAYS);

    await pool.query(
        `Insert into refresh_tokens (user_id, token_hash, expires_at) values ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
    );

    return { user: { id: userId, email, name }, accessToken, refreshToken };
}