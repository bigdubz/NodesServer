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
        createdAt: string;
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

export type ServerMessage = ServerAuthOK | ServerAuthError | ServerChatMessage | ServerMessageDelivered | ServerError;