import type { Context } from "hono";
import { verify } from "jsonwebtoken";
import { jwtPayloadSchema } from "../schemas/auth"; // Schema validasi JWT payload

export const authMiddleware = async (c: Context, next: () => Promise<void>) => {
    try {
        const authHeader = c.req.header("Authorization");
        
        // Validasi header
        if (!authHeader) {
            return c.json(
                { success: false, message: "Authorization header required" },
                401
            );
        }

        const [type, token] = authHeader.split(" ");
        
        if (type !== "Bearer" || !token) {
            return c.json(
                { success: false, message: "Format token tidak valid" },
                401
            );
        }

        // Validasi secret
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET not configured");
            return c.json(
                { success: false, message: "Server configuration error" },
                500
            );
        }

        // Verifikasi token
        const decoded = verify(token, process.env.JWT_SECRET);
        
        // Validasi payload dengan Zod
        const validatedPayload = jwtPayloadSchema.parse(decoded);

        // Simpan user di context
        c.set("user", {
            id: validatedPayload.sub,
            email: validatedPayload.email
        });

        // Teruskan ke handler
        await next();

    } catch (error) {
        console.error("🔒 Auth middleware error:", error);
        
        const errorMessage = error instanceof Error 
            ? error.name === "TokenExpiredError"
                ? "Token expired"
                : error.name === "JsonWebTokenError"
                    ? "Invalid token"
                    : error.message
            : "Unknown error";

        return c.json(
            {
                success: false,
                message: `Authentication failed: ${errorMessage}`
            },
            401
        );
    }
};