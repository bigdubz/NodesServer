import jwt from "jsonwebtoken";

const SECRET = "WHAT_CAN_YOU_DO_OH_WELL_QUESTION_MARK";

export function verifyToken(token: string): string | null {
    try {
        const decoded = jwt.verify(token, SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}