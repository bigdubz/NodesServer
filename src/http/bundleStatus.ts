import type { IncomingMessage, ServerResponse } from "http";
import type { BundleStatusResponse } from "../types";
import { verifyDeviceToken } from "../auth/token";
import { BundlesDB } from "../db/bundles";

export async function handleBundleStatus(req: IncomingMessage, res: ServerResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
    const user = verifyDeviceToken(token);
    if (!user) {
        res.statusCode = 401;
        return res.end("Invalid token");
    }

    const status = BundlesDB.getBundleStatus(user.userId, user.deviceId) as BundleStatusResponse;

    console.log("Bundle status:", status);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(status));
}