import type {ClientConnection} from "../types";

export function sendOk(conn: ClientConnection, type: string, payload?: object) {
    conn.ws.send(JSON.stringify({
        type,
        payload
    }));
}

export function sendError(conn: ClientConnection, code: string, error: string) {
    if (!conn) {
        return;
    }
    conn.ws.send(JSON.stringify({
        type: "ERROR",
        payload: { code, error }
    }));
}
