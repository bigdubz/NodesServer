import type { IncomingMessage, ServerResponse } from "http";
import type { UserKeyBundle, UserKeyBundleResponse } from "../types";
import { BundlesDB } from "../db/bundles";
import { validateBundle, validateUserId, verifySpkSignature } from "../utils/validate";
import { verifyDeviceToken } from "../auth/token";

type JsonBuffer = {
    type: "Buffer";
    data: number[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function toBuffer(value: unknown): Buffer {
    if (Buffer.isBuffer(value)) {
        return value;
    }

    if (Array.isArray(value) && value.every(isByte)) {
        return Buffer.from(value);
    }

    if (isJsonBuffer(value)) {
        return Buffer.from(value.data);
    }

    return Buffer.alloc(0);
}

function isJsonBuffer(value: unknown): value is JsonBuffer {
    return isRecord(value) &&
        value.type === "Buffer" &&
        Array.isArray(value.data) &&
        value.data.every(isByte);
}

function isByte(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 255;
}

function bundleFromPayload(payload: unknown, userId: string, deviceId: string): UserKeyBundle {
    const body = isRecord(payload) ? payload : {};

    return {
        userId,
        deviceId,
        registrationId: Number(body.registrationId),
        sk: toBuffer(body.sk),
        ik: toBuffer(body.ik),
        spk: toBuffer(body.spk),
        spkSignature: toBuffer(body.spkSignature),
        opks: Array.isArray(body.opks) ? body.opks.map(toBuffer) : []
    };
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;

            if (body.length > 1024 * 1024) {
                reject(new Error("Request body too large"));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error("Invalid JSON"));
            }
        });

        req.on("error", reject);
    });
}

function sendJson(res: ServerResponse, statusCode: number, payload: object): void {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
}

function getBearerUser(req: IncomingMessage): { userId: string; deviceId: string } | null {
    const authHeader: string | undefined = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }

    const token: string = authHeader.slice("Bearer ".length);
    return verifyDeviceToken(token);
}

export async function handleUploadBundle(req: IncomingMessage, res: ServerResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        return res.end();
    }

    if (req.method !== "POST") {
        res.statusCode = 405;
        return res.end("Method not allowed");
    }

    const user = getBearerUser(req);
    if (!user) {
        res.statusCode = 401;
        return res.end("Missing or invalid Authorization header");
    }

    let payload: unknown;

    try {
        payload = await readJsonBody(req);
    } catch (err) {
        res.statusCode = 400;
        return res.end(err instanceof Error ? err.message : "Invalid request body");
    }

    const bundle = bundleFromPayload(payload, user.userId, user.deviceId);

    if (!validateBundle(bundle)) {
        return sendJson(res, 400, {
            code: "300",
            error: "Invalid bundle fields"
        });
    }

    if (!verifySpkSignature(bundle.sk, bundle.spk, bundle.spkSignature)) {
        return sendJson(res, 400, {
            code: "303",
            error: "Invalid SPK signature"
        });
    }

    try {
        BundlesDB.saveBundle(bundle);

        console.log("Bundle saved:", bundle);

        return sendJson(res, 200, {
            type: "UPLOAD_BUNDLE_OK",
            payload: {
                userId: user.userId,
                deviceId: user.deviceId
            }
        });
    } catch {
        return sendJson(res, 500, {
            code: "301",
            error: "Bundle upload failed"
        });
    }
}

export function handleFetchBundles(req: IncomingMessage, res: ServerResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        return res.end();
    }

    if (req.method !== "GET") {
        res.statusCode = 405;
        return res.end("Method not allowed");
    }

    const user = getBearerUser(req);
    if (!user) {
        res.statusCode = 401;
        return res.end("Missing or invalid Authorization header");
    }

    const url = new URL(req.url ?? "", "http://localhost");
    const userId = url.searchParams.get("userId") ?? "";

    if (!validateUserId(userId)) {
        return sendJson(res, 400, {
            code: "201",
            error: "Invalid user ID: " + userId
        });
    }

    if (userId === user.userId) {
        return sendJson(res, 500, {
            code: "304",
            error: "Cannot fetch bundles for own user"
        })
    }

    try {
        const bundles: UserKeyBundleResponse[] = BundlesDB.getBundles(userId);
        console.log("Bundles fetched:", bundles);
        return sendJson(res, 200, {
            type: "FETCH_BUNDLES_OK",
            payload: bundles
        });
    } catch {
        console.log("Error fetching bundles");
        return sendJson(res, 500, {
            code: "302",
            error: "Bundle fetch failed"
        });
    }
}
