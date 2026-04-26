import type { WebSocket } from "ws";
import type { ClientMessage, ServerMessage, } from "../types.js";
import { broadcast, sendPresence } from "../utils/broadcast.js"
import { connectionManager } from "../connectionManager.js";
import { verifyToken } from "../auth/verifyToken.js";
import { MessageDB, type MessageRow } from "../db/undeliveredMessages";


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

    (ws as any).userId = userId;
    (ws as any).deviceId = deviceId;
    connectionManager.add(userId, deviceId, ws);

    ws.send(JSON.stringify({
        type: "AUTH_OK",
        payload: { userId }
    } as ServerMessage));

    const undelivered: MessageRow[] = MessageDB.getUndeliveredMessages(userId, deviceId);

    for (const msg of undelivered) {
        ws.send(JSON.stringify({
            type: "ENCRYPTED_RELAY",
            payload: {
               toUserId: msg.toUserId,
               toDeviceId: msg.toDeviceId,
               fromUserId: msg.fromUserId,
               fromDeviceId: msg.fromDeviceId,
               blob: msg.blob.toString("base64")
            }
        } as ServerMessage));
    }

    // this should only trigger if this is the first device on which the user is online
    broadcast({
        type: "USER_ONLINE",
        payload: { userId }
    } as ServerUserOnline);
    sendPresence(userId);
}
