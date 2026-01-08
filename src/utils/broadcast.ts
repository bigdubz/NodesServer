import { WebSocket } from "ws";
import { connectionManager } from "../connectionManager.js"

export function broadcast(msg: object): void {
    for (const ws of connectionManager.getAllOnline()) {
        ws.send(JSON.stringify(msg))
    }
}

export function sendPresence(userId: string): void {
    const ws = connectionManager.get(userId) as WebSocket;
    for (const user of connectionManager.getUserIdsOnline()) {
        if (ws.readyState === WebSocket.OPEN && user !== (ws as any).userId) {
            ws.send(JSON.stringify({
                type: "USER_ONLINE",
                payload: { userId: user }
            }))
        }
    }
}