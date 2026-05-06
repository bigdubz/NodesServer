import type { ClientMessage, UserKeyBundle } from "../types";
import sodium from "libsodium-wrappers"
import { MAX_ONE_TIME_PREKEYS_PER_UPLOAD } from "../constants";

await sodium.ready

export function validateUserId(userId: string): boolean {
    return userId.length >= 1 && userId.length <= 64;
}

function isValidRegistrationId(registrationId: number): boolean {
    return Number.isInteger(registrationId) && registrationId >= 0 && registrationId <= 0xffff_ffff;
}

function isBufferOfLength(value: Buffer, expectedLength: number): boolean {
    return Buffer.isBuffer(value) && value.length === expectedLength;
}

export function validateBundle(bundle: UserKeyBundle): boolean {
    const {
        userId,
        deviceId,
        registrationId,
        sk,
        ik,
        spk,
        spkSignature,
        opks
    } = bundle;

    return userId.length >= 1 && userId.length <= 64 &&
            deviceId.length >= 1 && deviceId.length <= 64 &&
            isValidRegistrationId(registrationId) &&
            isBufferOfLength(sk, sodium.crypto_sign_PUBLICKEYBYTES) &&
            isBufferOfLength(ik, 32) &&
            isBufferOfLength(spk, 32) &&
            isBufferOfLength(spkSignature, sodium.crypto_sign_BYTES) &&
            opks.length <= MAX_ONE_TIME_PREKEYS_PER_UPLOAD &&
            opks.every((opk: Buffer) => isBufferOfLength(opk, 32));
}

export function validateRelayMessage(msg: Extract<ClientMessage, { type: "ENCRYPTED_SEND" }>): boolean {
    const { toUserId, toDeviceId, blob } = msg.payload;

    return toUserId.length >= 1 && toUserId.length <= 64 &&
            toDeviceId.length >= 1 && toDeviceId.length <= 64 &&
            blob.length > 0 && blob.length <= 16 * 1024;  // 16 KB
}

export function verifySpkSignature(
    sk: Buffer,
    spk: Buffer,
    signature: Buffer,
): boolean {
    if (sk.length !== sodium.crypto_sign_PUBLICKEYBYTES ||
        signature.length !== sodium.crypto_sign_BYTES) return false;

    return sodium.crypto_sign_verify_detached(signature, spk, sk);
}
