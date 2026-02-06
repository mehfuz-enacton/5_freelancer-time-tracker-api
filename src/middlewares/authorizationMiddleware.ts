import USER, { IUser } from "../models/user";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        let token;

        if(authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if(!token) return res.status(401).json({ msg: "You are not logged in" });  

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        const user = await USER.findById(decodedToken.id);
        if(!user) return res.status(401).json({ msg: "The user belonging to this token does not exist" });

        req.user = user;
        next();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(401).json({ msg: "Not authorized", error: errorMessage });
    }
}