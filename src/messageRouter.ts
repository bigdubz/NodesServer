import type { WebSocket } from "ws";
import type { ClientMessage } from "./types.js";
import { onAuth } from "./handlers/authHandler.js";
import { relayMessage } from "./handlers/relay.js";
import { onAck } from "./handlers/ackHandler";
import { connectionManager } from "./connectionManager";
import { sendError } from "./utils/send";

export function routeMessage(ws: WebSocket, msg: ClientMessage): void {
    const conn = connectionManager.findBySocket(ws);
    switch (msg.type) {
        case "AUTH":
            return onAuth(ws, msg);

        case "ENCRYPTED_SEND":
            if (!conn) {
                return;
            }
            return relayMessage(conn, msg);

        case "ACK":
            if (!conn) {
                return;
            }
            return onAck(conn, msg);

        default:
            if (!conn) {
                return;
            }
            sendError(conn, "100", "Unknown message type: " + msg)
            return;
    }
}
