// The "Envelope" the server sees
export type EncryptedEnvelope = {
    toUserId: string;
    toDeviceId: string;
    fromUserId: string;
    fromDeviceId: string;
    clientNonce: number; // Random number for ACK purposes

    // Double Ratchet Metadata (Opaque to server, but needed for decryption)
    dhPublicKey: string;      // Base64 encoded public key
    messageNumber: number;
    previousChainLength: number;

    // The actual encrypted blob
    iv: string;              // Base64 nonce
    ciphertext: string;      // The encrypted 'EncryptedPayload' bytes
}

export type UserKeyBundle = {
    userId: string;
    deviceId: string;
    registrationId: number;

    // Signing Key (SK) - Long-term
    sk: string;

    // Identity Key (IK) - Long-term
    ik: string;

    // Signed Prekey (SPK) - Medium-term
    spk: string;
    spkSignature: string;

    // One-Time Prekeys (OPKs) - Single-use
    // We send an array so the server can dish them out one by one
    opks: string[];
};

// Your refined message types
export type ClientMessage =
    | { type: "AUTH"; payload: { userId: string; token: string } }
    | { type: "ENCRYPTED_SEND"; payload: EncryptedEnvelope }
    | { type: "UPLOAD_BUNDLE"; payload: UserKeyBundle }; // X3DH setup

export type ServerMessage =
    | { type: "AUTH_OK"; payload: { userId: string } }
    | { type: "ENCRYPTED_RELAY"; payload: EncryptedEnvelope }
    | { type: "ERROR"; payload: { code: string; error: string } };