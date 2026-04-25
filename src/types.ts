export type EncryptedEnvelope = {
    fromUserId: string;
    fromDeviceId: string;
    toUserId: string;
    toDeviceId: string;
    clientNonce: number; // Random number for ACK purposes (might be unnecessary and will most likely be deleted later)

    dhPublicKey: string;
    messageNumber: number;
    previousChainLength: number;

    iv: string;
    ciphertext: string;     // The encrypted 'EncryptedPayload' bytes
}

export type UserKeyBundle = {
    userId: string;
    deviceId: string;
    registrationId: number;

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

export type ClientMessage =
    // client generates deviceId locally (uuid) unnecessary but just simple
    | { type: "AUTH"; payload: { userId: string; deviceId: string, token: string } }
    | { type: "ENCRYPTED_SEND"; payload: EncryptedEnvelope }
    | { type: "UPLOAD_BUNDLE"; payload: UserKeyBundle }; // X3DH setup

export type ServerMessage =
    | { type: "AUTH_OK"; payload: { userId: string } }
    | { type: "ENCRYPTED_RELAY"; payload: EncryptedEnvelope }
    | { type: "ERROR"; payload: { code: string; error: string } };