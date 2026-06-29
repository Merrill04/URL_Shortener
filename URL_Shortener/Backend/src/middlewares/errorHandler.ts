import {Request, Response, NextFunction} from 'express';

interface AppError extends Error{
    status?: number;
}

export function errorHandler(err : AppError, _req: Request, res: Response, _next: NextFunction){
    console.error(err);
    const status = err.status || 500;
    const message = err.message || "Internal server error";
    res.status(status).json({message});
}