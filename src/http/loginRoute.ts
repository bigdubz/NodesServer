import { IncomingMessage, ServerResponse } from "http";
import { createToken } from "../auth/createToken.js"
import { UsersTable } from "../db/usersTable";
import bcrypt from "bcrypt";

export function handleLogin(req: IncomingMessage, res: ServerResponse) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        return res.end();
    }

    if (req.method !== "POST") {
        res.statusCode = 405;
        return res.end("Method not allowed");
    }

    let body: string = "";

    req.on("data", chunk => (body += chunk))
    req.on("end", async () => {
        const { userId, password } = JSON.parse(body);

        const user = UsersTable.getUser(userId);
        if (!user) {
            res.statusCode = 401;
            return res.end("Invalid user or password");
        }

        const ok: boolean = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            res.statusCode = 401;
            return res.end("Invalid user or password");
        }

        const token: string = createToken(userId);

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            token,
            userId
        }));
    })
}