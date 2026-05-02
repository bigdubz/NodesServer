import type { ClientConnection, ClientMessage, UserKeyBundle, UserKeyBundleResponse } from "../types";
import { BundlesDB } from "../db/bundles";
import { validateBundle, validateUserId, verifySpkSignature } from "../utils/validate";
import { sendError, sendOk } from "../utils/send";

export function onUploadBundle(conn: ClientConnection, msg: Extract<ClientMessage, { type: "UPLOAD_BUNDLE" }>) {
    const bundle: UserKeyBundle = {
        userId: conn.auth.userId,
        deviceId: conn.auth.deviceId,
        registrationId: msg.payload.registrationId,
        sk: msg.payload.sk,
        ik: msg.payload.ik,
        spk: msg.payload.spk,
        spkSignature: msg.payload.spkSignature,
        opks: msg.payload.opks
    }

    if (!validateBundle(bundle)) {
        sendError(conn, "300", "Invalid bundle fields");
        return;
    }

    if (!verifySpkSignature(msg.payload.sk, msg.payload.spk, msg.payload.spkSignature)) {
        sendError(conn, "303", "Invalid SPK signature")
        return;
    }

    try {
        BundlesDB.saveBundle(bundle);
        sendOk(conn, "UPLOAD_BUNDLE_OK");
    } catch (err) {
        sendError(conn, "301", "Bundle upload failed")
    }
}

export function onFetchBundles(conn: ClientConnection, msg: Extract<ClientMessage, { type: "FETCH_BUNDLES" }>) {
    if (!validateUserId(msg.payload.userId)) {
        sendError(conn, "201", "Invalid user ID: " + msg.payload.userId);
        return;
    }

    try {
        const bundles: UserKeyBundleResponse[] = BundlesDB.getBundles(msg.payload.userId);
        sendOk(conn, "FETCH_BUNDLES_OK", bundles);
    } catch (err) {
        sendError(conn, "302", "Bundle fetch failed");
    }
}