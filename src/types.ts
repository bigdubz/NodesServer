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

    // signing key
    sk: Buffer;

    // identity key
    ik: Buffer;

    // signed prekey
    spk: Buffer;
    spkSignature: Buffer;

    // one-time prekeys
    opks: Buffer[];
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

// client -> server
export type ClientMessage =
    // client generates deviceId locally (uuid) unnecessary but just simple
    | { type: "AUTH"; payload: AuthRequest }
    | { type: "ENCRYPTED_SEND"; payload: Message }
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

export type DeviceTokenPayload = {
    userId: string;
    deviceId: string;
    deviceToken: string;
}

export type BundleStatusResponse = {
    userId: string;
    deviceId: string;
    bundleMissing: boolean;

    oneTimePrekeyCount: number;
    oneTimePrekeyTarget: number;
    maxOneTimePrekeysPerUpload: number;

    signedPrekeyStale: boolean;
    signedPrekeyId: number;
    signedPrekeyCreatedAt: number;

    lastBundleUploadAt: number;
    serverTime: number;
}

// server -> client
export type ServerMessage =
    | { type: "AUTH_OK"; payload: { userId: string; } }
    | { type: "ENCRYPTED_RELAY"; payload: ServerRelay }
    | { type: "ERROR"; payload: ServerError };
