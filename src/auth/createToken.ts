import jwt from "jsonwebtoken";

const SECRET = "WHAT_CAN_YOU_DO_OH_WELL_QUESTION_MARK";

export function createToken(userId: string) {
    return jwt.sign({ userId }, SECRET, { expiresIn: "30d" });
}
