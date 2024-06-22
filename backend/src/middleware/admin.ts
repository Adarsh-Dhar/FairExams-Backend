import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jwtPassword = process.env.JWT_PASSWORD || "admin";

interface CustomRequest extends Request {
    admin?: any; // Define the type of adminData here
}

async function adminMiddleware(req: CustomRequest, res: Response, next: NextFunction) {
    const email: string = req.headers.email as string;
    const password: string = req.headers.password as string;

    try {
        // Find the admin in the database
        const findadmin = await prisma.admin.findUnique({
            where: {
                email: email,
                password: password
            }
        });

        // Check if admin exists
        if (!findadmin) {
            return res.status(401).json({ error: "Couldn't find the admin" });
        }

        // Generate and verify JWT token
        const token = signJwt(email, password);
        if (!token) {
            return res.status(401).json({ error: "Invalid admin or password" });
        }

        const verified = verifyJwt(token, jwtPassword);
        if (!verified) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Attach admin data to request object
        req.admin = findadmin;

        next(); // Call next middleware
    } catch (error) {
        console.error('Error in authentication middleware:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

function signJwt(email: string, password: string): string | null {
    

    const payload = { email, password };
    const token = jwt.sign(payload, jwtPassword);
    return token;
}

function verifyJwt(token: string, jwtPassword: string): boolean {
    try {
        jwt.verify(token, jwtPassword);
        console.log("Password is verified");
        return true;
    } catch (error) {
        console.error("Error in JWT verification:", error);
        return false;
    }
}

export default adminMiddleware;