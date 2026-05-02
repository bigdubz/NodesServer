import type { ClientMessage, UserKeyBundle } from "../types";
import sodium from "libsodium-wrappers"

await sodium.ready

export function validateUserId(userId: string): boolean {
    return userId.length >= 1 && userId.length <= 64;
}

export function validateBundle(bundle: UserKeyBundle): boolean {
    const {
        userId,
        deviceId,
        sk,
        ik,
        spk,
        spkSignature,
        opks
    } = bundle;

    return userId.length >= 1 && userId.length <= 64 &&
            deviceId.length >= 1 && deviceId.length <= 64 &&
            sk.length === 32 && ik.length === 32 &&
            spk.length === 32 && spkSignature.length === 64 &&
            opks.length <= 100;
}

export function validateRelayMessage(msg: Extract<ClientMessage, { type: "ENCRYPTED_SEND" }>): boolean {
    const { toUserId, toDeviceId, blob } = msg.payload;

    return toUserId.length >= 1 && toUserId.length <= 64 &&
            toDeviceId.length >= 1 && toDeviceId.length <= 64 &&
            blob.length > 0 && blob.length <= 16 * 1024;  // 16 KB
}

export function verifySpkSignature(
    skPublicKeyB64: string,
    spkB64: string,
    signatureB64: string,
): boolean {
    const sk = sodium.from_base64(skPublicKeyB64);
    const spk = sodium.from_base64(spkB64);
    const signature = sodium.from_base64(signatureB64);

    if (sk.length !== sodium.crypto_sign_PUBLICKEYBYTES ||
        signature.length !== sodium.crypto_sign_BYTES) return false;

    return sodium.crypto_sign_verify_detached(signature, spk, sk);
}