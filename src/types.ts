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

// client -> server
export type ClientMessage =
    // client generates deviceId locally (uuid) unnecessary but just simple
    | { type: "AUTH"; payload: { userId: string; deviceId: string, token: string } }
    | { type: "ENCRYPTED_SEND"; payload: Message }
    | { type: "UPLOAD_BUNDLE"; payload: UserKeyBundle } // X3DH setup
    | { type: "ACK"; payload: { blobHash: Buffer } };

// server -> client
export type ServerMessage =
    | { type: "AUTH_OK"; payload: { userId: string } }
    | { type: "ENCRYPTED_RELAY"; payload: {
        toUserId: string;
        toDeviceId: string;
        fromUserId: string;
        fromDeviceId: string;
        blob: string
    } }
    | { type: "ERROR"; payload: { code: string; error: string } };
