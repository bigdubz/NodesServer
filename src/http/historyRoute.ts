import { IncomingMessage, ServerResponse } from "http";
import { verifyToken } from "../auth/verifyToken.js";
import { MessageDB } from "../db";
import type { MessageRow } from "../types";

export async function handleHistory(req: IncomingMessage, res: ServerResponse) {

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

    // dummy. doesn't matter
    const url = new URL(req.url!, "http://localhost");
    const peer: string | null = url.searchParams.get("user");
    const before: string | null = url.searchParams.get("before");
    const limit: string | null = url.searchParams.get("limit");

    if (!peer) {
        res.statusCode = 400;
        return res.end("Missing user parameter");
    }

    const beforeTs = before ? Number(before) : Date.now();
    const limitNum = limit ? Number(limit) : 50;

    const rows: MessageRow[] = MessageDB.getMessages(userId, peer, beforeTs, limitNum);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(rows));
}
