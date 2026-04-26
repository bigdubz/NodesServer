import type { WebSocket } from "ws";
import type { ClientMessage } from "../types";
import { MessageDB } from "../db/undeliveredMessages";


export function onAck(ws: WebSocket, msg: Extract<ClientMessage, { type: "ACK" }>): void {
    if (!(ws as any).userId || !(ws as any).deviceId)  {
        return;
    }

    const { blobHash } = msg.payload;

    MessageDB.deleteTempMessage((ws as any).userId, (ws as any).deviceId, blobHash);

    // todo: make messages expire (ttl cleanup)
}