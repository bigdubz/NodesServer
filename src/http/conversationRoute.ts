import {IncomingMessage, ServerResponse} from "http";
import {verifyToken} from "../auth/verifyToken";
import {MessageDB} from "../db";

export async function handleConversations(req: IncomingMessage, res: ServerResponse) {

    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    if (req.method !== "GET") {
        res.writeHead(405);
        return res.end("Method not allowed");
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
        res.writeHead(401);
        return res.end("Missing or invalid Authorization header");
    }

    const token = authHeader.slice("Bearer ".length);
    const userId = verifyToken(token);
    if (!userId) {
        res.writeHead(401);
        return res.end("Invalid token");
    }

    const conversations = MessageDB.getConversations(userId)

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(conversations));
}
