import type { WebSocket } from "ws";
import type { ClientMessage, DeviceTokenPayload, ServerMessage } from "../types.js";
// import { broadcast, sendPresence } from "../utils/broadcast.js"
import { connectionManager } from "../connectionManager.js";
import { createDeviceToken, verifyBootstrapToken } from "../auth/token.js";
import { MessageDB, type MessageRow } from "../db/undeliveredMessages";
import { sendOk } from "../utils/send";


export function onAuth(ws: WebSocket, msg: Extract<ClientMessage, { type: "AUTH"}> ): void {
    const { userId, deviceId, token } = msg.payload;

    const verifiedUserId: string | null = verifyBootstrapToken(token);

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
    const deviceToken = createDeviceToken(userId, deviceId);
    const payload: DeviceTokenPayload = { userId, deviceId, deviceToken };
    sendOk(conn, "AUTH_OK", payload);
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
    // broadcast({
    //     type: "USER_ONLINE",
    //     payload: { userId }
    // });
    // sendPresence(userId);
}
