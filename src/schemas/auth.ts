import { z } from "zod";

export const jwtPayloadSchema = z.object({
    sub: z.string().uuid(),
    email: z.string().email(),
    iat: z.number().optional(),
    exp: z.number().optional()
});