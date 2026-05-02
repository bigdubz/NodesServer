import type { ClientConnection, ClientMessage } from "../types";
import { MessageDB } from "../db/undeliveredMessages";


export function onAck(conn: ClientConnection, msg: Extract<ClientMessage, { type: "ACK" }>): void {
    const { blobHash } = msg.payload;

    MessageDB.deleteTempMessage(conn.auth.userId, conn.auth.deviceId, blobHash);

    // todo: make messages expire (ttl cleanup)
}