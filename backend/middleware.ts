import type { NextFunction, Request , Response } from "express";
import { createClient } from "./client";
import { UserScalarFieldEnum } from "./prisma/generated/client/internal/prismaNamespace";
import { prisma } from "./db.js";

const client = createClient();


export async function middleware (req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    const { data, error } = await client.auth.getUser(token);
    const userId = data.user?.id;
    if (userId){
        const email = data.user?.email || "";
        
        if (email) {
            try {
                const dbUser = await prisma.user.upsert({
                    where: { email },
                    update: {},
                    create: {
                        email,
                        provider: data.user?.app_metadata?.provider === "google" ? "Google" : "Github",
                        supabaseId: userId,
                        name: data.user?.user_metadata?.full_name || "User"
                    }
                });
                
                // IMPORTANT: Use the internal Postgres ID for relationship linking later
                (req as any).userId = dbUser.id;
            } catch (e) {
                console.error("Error syncing user to DB:", e);
                (req as any).userId = userId;
            }
        }

        next();
    } else {
        res.status(403).json({
            message: "Incorrect inputs "
        })
    }
}