import type { ClientMessage } from "./types.js";
import http from "http";
import { WebSocketServer } from "ws";
import { routeMessage } from "./messageRouter.js";
import { connectionManager } from "./connectionManager.js";
import { handleLogin } from "./http/loginRoute.js";
import { handleHistory } from "./http/historyRoute.js";
import { setOffline } from "./presence/presenceStore.js";
import { broadcast } from "./utils/broadcast.js";

const PORT = 8080;

// http server
const server = http.createServer((req, res) => {
    const path = req.url?.split("?")[0];
    if (path === "/login") {
        return handleLogin(req, res);
    }
    if (path === "/history") {
        return handleHistory(req, res);
    }

    res.writeHead(200);
    res.end("WebSocket server is running.\n");
});

// websocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    console.log("Client connected");

    (ws as any).isAlive = true;
    ws.on("pong", () => {
        (ws as any).isAlive = true;
    })

    ws.on("message", (raw) => {
        try {
            const msg = JSON.parse(raw.toString()) as ClientMessage;
            routeMessage(ws, msg);
        } catch (err) {
            console.error("Error parsing message:", err);
        }
    });

    ws.on("close", () => {
        const userId = (ws as any).userId;
        if (!userId) return;
        setOffline(userId);
        broadcast({ type: "USER_OFFLINE", payload: { userId, lastSeen: Date.now() } });
        connectionManager.remove(userId);
        console.log("Client disconnected (", userId, ")");
    });
});

wss.on("close", () => clearInterval(interval));

const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) {
            console.log("Terminating dead connection");
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, 30000 );

server.listen(PORT, "0.0.0.0", () => console.log(`Server is running on port ${PORT}`));
