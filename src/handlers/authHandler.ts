import type { WebSocket } from "ws";
import type { ClientMessage, ServerMessage } from "../types.js";
import { broadcast, sendPresence } from "../utils/broadcast.js"
import { connectionManager } from "../connectionManager.js";
import { verifyToken } from "../auth/verifyToken.js";
import { MessageDB, type MessageRow } from "../db/undeliveredMessages";
import { sendOk } from "../utils/send";


export function onAuth(ws: WebSocket, msg: Extract<ClientMessage, { type: "AUTH"}> ): void {
    const { userId, deviceId, token } = msg.payload;

    const verifiedUserId: string | null = verifyToken(token);

    if (!verifiedUserId || verifiedUserId !== userId) {
        const error: ServerMessage = {
            type: "ERROR",
            payload: { code: "200", error: "Invalid or expired token" }
        };
        ws.send(JSON.stringify(error));
        ws.close();
        return;
    }

    const conn = connectionManager.add(ws, userId, deviceId);
    sendOk(conn, "AUTH_OK", { userId });
    const undelivered: MessageRow[] = MessageDB.getUndeliveredMessages(userId, deviceId);

    for (const msg of undelivered) {
        const payload = {
            toUserId: msg.toUserId,
            toDeviceId: msg.toDeviceId,
            fromUserId: msg.fromUserId,
            fromDeviceId: msg.fromDeviceId,
            blob: msg.blob.toString("base64")
        }
        sendOk(conn, "ENCRYPTED_RELAY", payload)
    }

    // this should only trigger if this is the first device on which the user is online
    broadcast({
        type: "USER_ONLINE",
        payload: { userId }
    } as ServerUserOnline);
    sendPresence(userId);
}
