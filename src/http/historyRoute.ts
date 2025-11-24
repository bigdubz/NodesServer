import { IncomingMessage, ServerResponse } from "http";
import { verifyToken } from "../auth/verifyToken.js";
import { MessageDB } from "../db/index.js"

export async function handleHistory(req: IncomingMessage, res: ServerResponse) {

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
        console.log("hi");
        return res.end("Method not allowed");
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
        res.writeHead(401);
        return res.end("Missing or invalid Authorization header");
    }

    const token = authHeader.slice("Bearer ".length);
    const decoded = verifyToken(token);
    if (!decoded) {
        res.writeHead(401);
        return res.end("Invalid token");
    }

    const userId: string = decoded;

    // dummy, doesn't matter
    const url = new URL(req.url!, "http://localhost");
    const peer = url.searchParams.get("user");
    const before = url.searchParams.get("before");
    const limit = url.searchParams.get("limit");

    if (!peer) {
        res.writeHead(400);
        return res.end("Missing user parameter");
    }

    const beforeTs = before ? Number(before) : Date.now();
    const limitNum = limit ? Number(limit) : 50;

    const rows = MessageDB.getMessages(userId, peer, beforeTs, limitNum);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(rows));
}
