import {Response, NextFunction} from 'express';
import { AuthRequest } from '../types';
import * as urlService from '../services/url.service';

export async function createUrl(req: AuthRequest, res: Response, next: NextFunction){
    try{
        const userId = req.user!.userId;
        const {originalUrl, customAlias, title, expiresAt} = req.body;

        if(!originalUrl){
            if(!originalUrl){
                return res.status(400).json({ message: 'originalUrl is required' });
            }
        }

        const url = await urlService.createUrl({userId, originalUrl, customAlias, title, expiresAt});
        res.status(201).json(url);
    }catch(err){
        next(err);
    }
}

export async function listUrls(req:AuthRequest, res: Response, next: NextFunction){
    try{
        const userId = req.user!.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await urlService.getUserUrls(userId, page, limit);
        res.status(200).json(result);
    }catch(err){
        next(err);
    }
}

export async function getUrl(req: AuthRequest, res: Response, next: NextFunction){
    try{
        const userId = req.user!.userId;
        const {id} = req.params;

        if(typeof id !== "string"){
            return res.status(400).json({ message: "Invalid id type" });
        }

        const url = await urlService.getUrlById(userId, id);
        res.status(200).json(url);
    }catch(err){
        next(err);
    }
}

export async function updateUrl(req: AuthRequest, res: Response, next: NextFunction){
    try{
        const userId = req.user!.userId;
        const {id} = req.params;
        const {title, originalUrl, expiresAt, isActive} = req.body;

        if(typeof id !== "string"){
            return res.status(400).json({ message: "Invalid id type" });
        }

        const url = await urlService.updateUrl(userId, id, {title, originalUrl, expiresAt, isActive});
        res.status(200).json(url);
    }catch(err){
        next(err);
    }
}

export async function deleteUrl(req: AuthRequest, res: Response, next: NextFunction){
    try{
        const userId = req.user!.userId;
        const {id} = req.params;

        if(typeof id !== "string"){
            return res.status(400).json({ message: "Invalid id type" });
        }

        await urlService.deleteUrl(userId, id);
        res.status(200).json({ message: 'URL deleted successfully' });
    }catch(err){
        next(err);
    }
}

