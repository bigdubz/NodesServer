export type ClientAuthMessage = {
    type: "AUTH";
    payload: {
        userId: string;
        token: string
    };
};

export type ClientChatMessage = {
    type: "CHAT_MESSAGE";
    payload: {
        toUserId: string;
        text: string;
        clientId: string;
        replyingTo: string | null
    };
}

export type ClientAddReaction = {
    type: "ADD_REACTION";
    payload: {
        messageId: string;
        reaction: string;
        toUserId: string
    };
}

export type ClientRemoveReaction = {
    type: "REMOVE_REACTION";
    payload: {
        messageId: string;
        toUserId: string
    };
}

export type ClientMessageSeen = {
    type: "MESSAGE_SEEN";
    payload: { messageId: string };
}

export type ClientTyping = {
    type: "USER_TYPING",
    payload: {
        toUserId: string;
        isTyping: boolean;
    }
}

export type ClientMessage = ClientAuthMessage | ClientChatMessage | ClientMessageSeen | ClientTyping |
    ClientAddReaction | ClientRemoveReaction;

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
        isOnline: boolean;
        replyingTo: string | null;
    }
}

export type ServerMessageDelivered = {
    type: "MESSAGE_DELIVERED";
    payload: {
        messageId: string;
        clientId: string
    }
}

export type ServerMessageSeen = {
    type: "MESSAGE_SEEN";
    payload: { messageId: string };
}

export type ServerError = {
    type: "ERROR";
    payload: { error: string }
}

export type ServerUserTyping = {
    type: "USER_TYPING";
    payload: {
        fromUserId: string;
        isTyping: boolean;
    }
}

export type ServerUserOnline = {
    type: "USER_ONLINE";
    payload: { userId: string }
}

export type ServerUserOffline = {
    type: "USER_OFFLINE";
    payload: {
        userId: string;
        lastSeen: number
    };
}

export type ServerAddReaction = {
    type: "ADD_REACTION";
    payload: {
        messageId: string;
        userId: string;
        reaction: string
    }
}

export type ServerRemoveReaction = {
    type: "REMOVE_REACTION";
    payload: {
        messageId: string,
        userId: string
    }
}

export type ServerMessage = ServerAuthOK | ServerAuthError | ServerChatMessage | ServerMessageDelivered |
    ServerMessageSeen | ServerError | ServerUserOnline | ServerUserOffline | ServerAddReaction | ServerRemoveReaction;

export type PresenceState = {
    online: boolean;
    lastSeen: number | null;
}

export interface MessageRow {
    messageId: string;
    fromUserId: string;
    toUserId: string;
    text: string;
    createdAt: number;
    delivered: number; // 0 or 1
    read: number;      // 0 or 1
    replyingTo: string | null;
    reactions: Record<string, string> | null;
}

export type ConversationRow = {
    peerId: string;
    lastMessage: string;
    lastTimestamp: number;
    unreadCount: number;
    isOnline: boolean;
}

export type ChatPayLoad = {
    messageId: string;
    fromUserId: string;
    text: string;
    createdAt: number;
    isOnline: boolean;
    replyingTo: string | null;
}
