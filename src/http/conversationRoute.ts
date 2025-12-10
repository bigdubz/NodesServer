import { IncomingMessage, ServerResponse } from "http";
import { verifyToken } from "../auth/verifyToken";
import { MessageDB } from "../db";
import type {ConversationRow} from "../types";

export async function handleConversations(req: IncomingMessage, res: ServerResponse) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        return res.end();
    }

    if (req.method !== "GET") {
        res.statusCode = 405;
        return res.end("Method not allowed");
    }

    const authHeader: string | undefined = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
        res.statusCode = 401;
        return res.end("Missing or invalid Authorization header");
    }

    const token: string = authHeader.slice("Bearer ".length);
    const userId: string | null = verifyToken(token);
    if (!userId) {
        res.statusCode = 401;
        return res.end("Invalid token");
    }

    const conversations: ConversationRow[] = MessageDB.getConversations(userId)

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(conversations));
}
