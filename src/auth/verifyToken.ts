import jwt from "jsonwebtoken";

const SECRET = "VERY_SECRET_KEY_CHANGE_LATER";

export function verifyToken(token: string): string | null {
    try {
        const decoded = jwt.verify(token, SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}