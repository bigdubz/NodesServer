import { WebSocket } from "ws";
import type { ClientConnection } from "./types.js";

class ConnectionManager {
    private connections: Map<string, ClientConnection> = new Map<string, ClientConnection>();

    private makeKey(userId: string, deviceId: string): string {
        return JSON.stringify([userId, deviceId]);
    }

    add(ws: WebSocket, userId: string, deviceId: string): ClientConnection {
        const conn = { ws, auth: { userId, deviceId } };
        this.connections.set(
            this.makeKey(userId, deviceId),
            conn
        );

        return conn;
    }

    remove(userId: string, deviceId: string): void {
        this.connections.delete(this.makeKey(userId, deviceId));
    }

    get(userId: string, deviceId: string): ClientConnection | undefined {
        return this.connections.get(this.makeKey(userId, deviceId));
    }

    hasKey(userId: string, deviceId: string): boolean {
        return this.connections.has(this.makeKey(userId, deviceId));
    }

    hasWs(ws: WebSocket): boolean {
        return this.getAll().some(conn => conn.ws === ws);
    }

    getAll(): ClientConnection[] {
        return Array.from(this.connections.values());
    }

    getAllOnline(): ClientConnection[] {
        return this.getAll().filter(conn => conn.ws.readyState === WebSocket.OPEN);
    }

    getUserIdsOnline(): string[] {
        return this.getAllOnline().map(conn => conn.auth.userId);
    }

    findBySocket(ws: WebSocket): ClientConnection | undefined {
        return this.getAll().find(conn => conn.ws === ws);
    }
}

export const connectionManager = new ConnectionManager();