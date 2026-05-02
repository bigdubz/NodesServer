import { WebSocket } from "ws";

export type ClientConnection = {
    ws: WebSocket;

    auth: {
        userId: string;
        deviceId: string;
    };
}

export type AuthRequest = {
    userId: string;
    deviceId: string;
    token: string;
}

export type Message = {
    toUserId: string;
    toDeviceId: string;
    blob: Buffer;
}

export type UserKeyBundle = {
    userId: string;
    deviceId: string;
    registrationId: number;

    // todo: all of these should be changed to Buffer instead of string?
    // signing key
    sk: string;

    // identity key
    ik: string;

    // signed prekey
    spk: string;
    spkSignature: string;

    // one-time prekeys
    opks: string[];
};

export type UserKeyBundleResponse = {
    userId: string;
    deviceId: string;
    registrationId: number;
    sk: string;
    ik: string;
    spk: string;
    spkSignature: string;
    opk: {
        keyId: number;
        publicKey: string;
    } | null;
}

export type FetchBundleRequest = {
    requestId: string;
    userId: string;
}

// client -> server
export type ClientMessage =
    // client generates deviceId locally (uuid) unnecessary but just simple
    | { type: "AUTH"; payload: AuthRequest }
    | { type: "ENCRYPTED_SEND"; payload: Message }
    | { type: "UPLOAD_BUNDLE"; payload: UserKeyBundle } // X3DH setup
    | { type: "FETCH_BUNDLES"; payload: FetchBundleRequest }
    | { type: "ACK"; payload: { blobHash: Buffer } };

export type ServerRelay = {
    toUserId: string;
    toDeviceId: string;
    fromUserId: string;
    fromDeviceId: string;
    blob: string;
}

export type ServerError = {
    code: string;
    error: string;
}

// server -> client
export type ServerMessage =
    | { type: "AUTH_OK"; payload: { userId: string } }
    | { type: "ENCRYPTED_RELAY"; payload: ServerRelay }
    | { type: "FETCH_BUNDLES_OK"; payload: UserKeyBundleResponse[] }
    | { type: "ERROR"; payload: ServerError };
