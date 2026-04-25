import { WebSocket } from "ws";

class ConnectionManager {
    private connections: Map<string, WebSocket> = new Map<string, WebSocket>();

    private makeKey(userId: string, deviceId: string): string {
        return JSON.stringify([userId, deviceId]);
    }

    add(userId: string, deviceId: string, ws: WebSocket): void {
        this.connections.set(this.makeKey(userId, deviceId), ws);
    }

    remove(userId: string, deviceId: string): void {
        this.connections.delete(this.makeKey(userId, deviceId));
    }

    get(userId: string, deviceId: string): WebSocket | undefined {
        return this.connections.get(this.makeKey(userId, deviceId));
    }

    has(userId: string, deviceId: string): boolean {
        return this.connections.has(this.makeKey(userId, deviceId));
    }

    getAll(): WebSocket[] {
        return Array.from(this.connections.values());
    }

    getAllOnline(): WebSocket[] {
        return this.getAll().filter(ws => ws.readyState === WebSocket.OPEN);
    }

    getUserIdsOnline(): string[] {
        return this.getAllOnline().map(ws => (ws as any).userId);
    }
}

export const connectionManager = new ConnectionManager();