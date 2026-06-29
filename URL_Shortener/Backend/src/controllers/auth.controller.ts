import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction){
    try{
        const {email, password, name} = req.body;

        if(!email || !password || !name){
            return res.status(400).send({
                message: "email, name and password are required",
            })
        }

        if(password.length < 8){
            return res.status(400).send({
                message: "password must be atleast 8 characters"
            })
        }

        const result = await authService.registerUser(email, password, name);
        res.status(201).json(result);
    }catch(err){
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction){
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).send({
                message: "email and password are required"
            })
        }

        const result = await authService.loginUser(email, password);
        res.status(200).json(result);
    }catch(err){
        next(err);
    }
}

export async function refresh(req: Request, res: Response, next: NextFunction){
    try{
        const {refreshToken} = req.body;

        if(!refreshToken){
            return res.status(400).send({
                message: "refresh token is required"
            })
        }

        const result = await authService.refreshAccessToken(refreshToken);
        res.status(200).json(result);
    }catch(err){
        next(err);
    }
}

export async function logout(req: Request, res: Response, next: NextFunction){
    try{
        const {refreshToken} = req.body;

        if(!refreshToken){
            return res.status(400).send({
                message: "refresh token required"
            })
        }

        const result = await authService.logoutUser(refreshToken);
        res.status(200).json({message : "logged out successfully"});
    }catch(err){
        next(err);
    }
}