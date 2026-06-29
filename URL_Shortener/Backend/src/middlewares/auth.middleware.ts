import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthRequest } from '../types';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction){
    
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).send({
            message: "no token provided"
        })
    }

    const token = authHeader.split(' ')[1]!;

    try{
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    }catch{
        return res.status(401).send({
            message: "Invalid or expired access token"
        })
    }
}