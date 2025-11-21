import jwt from "jsonwebtoken";

const SECRET = "VERY_SECRET_KEY_CHANGE_LATER";

export function createToken(userId: string) {
    return jwt.sign({ userId }, SECRET, { expiresIn: "7h" });
}
