import { IncomingMessage, ServerResponse } from "http";
import { validateUser } from "../auth/userStore.js"
import { createToken } from "../auth/createToken.js"

export function handleLogin(req: IncomingMessage, res: ServerResponse) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    if (req.method !== "POST") {
        res.writeHead(405);
        return res.end("Method not allowed");
    }

    let body = "";

    req.on("data", chunk => (body += chunk))
    req.on("end", () => {
        try {
            const { userId, password } = JSON.parse(body);

            if (!validateUser(userId, password)) {
                res.writeHead(401);
                return res.end("Invalid credentials");
            }

            const token = createToken(userId);

            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify({ token }));
        } catch (err) {
            res.writeHead(400);
            res.end("Invalid JSON");
        }
    })
}