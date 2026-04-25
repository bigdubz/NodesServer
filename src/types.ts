export type EncryptedEnvelope = {
    fromUserId: string;
    fromDeviceId: string;
    toUserId: string;
    toDeviceId: string;
    clientNonce: number; // Random number for ACK purposes

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

    // signing Key
    sk: string;

    // identity Key
    ik: string;

    // signed Prekey (SPK)
    spk: string;
    spkSignature: string;

    // one-time Prekeys
    opks: string[];
};

// Your refined message types
export type ClientMessage =
    | { type: "AUTH"; payload: { userId: string; deviceId: string, token: string } }
    | { type: "ENCRYPTED_SEND"; payload: EncryptedEnvelope }
    | { type: "UPLOAD_BUNDLE"; payload: UserKeyBundle }; // X3DH setup

export type ServerMessage =
    | { type: "AUTH_OK"; payload: { userId: string } }
    | { type: "ENCRYPTED_RELAY"; payload: EncryptedEnvelope }
    | { type: "ERROR"; payload: { code: string; error: string } };