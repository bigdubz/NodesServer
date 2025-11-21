export type ClientAuthMessage = {
    type: "AUTH";
    payload: { userId: string; token: string };
};

export type ClientChatMessage = {
    type: "CHAT_MESSAGE";
    payload: { toUserId: string; text: string };
};

export type ClientMessage = ClientAuthMessage | ClientChatMessage;

export type ServerAuthOK = {
    type: "AUTH_OK";
    payload: { userId: string }
}

export type ServerAuthError = {
    type: "AUTH_ERROR";
    payload: { error: string }
}

export type ServerChatMessage = {
    type: "CHAT_MESSAGE";
    payload: {
        fromUserId: string;
        text: string;
        messageId: string;
        createdAt: number;
    }
}

export type ServerMessageDelivered = {
    type: "MESSAGE_DELIVERED";
    payload: { messageId: string }
}

export type ServerError = {
    type: "ERROR";
    payload: { error: string }
}

export type ServerUserOnline = {
    type: "USER_ONLINE";
    payload: { userId: string }
}

export type ServerUserOffline = {
    type: "USER_OFFLINE";
    payload: { userId: string; lastSeen: number };
}

export type ServerMessage = ServerAuthOK | ServerAuthError | ServerChatMessage | ServerMessageDelivered | ServerError |
    ServerUserOnline | ServerUserOffline;

export type PresenceState = {
    online: boolean;
    lastSeen: number | null;
}

export type MessageRow = {
    messageId: string;
    fromUserId: string;
    toUserId: string;
    text: string;
    createdAt: number;
    delivered: number; // 0 or 1
    read: number;      // 0 or 1
};

export type ChatPayLoad = {
    messageId: string;
    fromUserId: string;
    text: string;
    createdAt: number;
}