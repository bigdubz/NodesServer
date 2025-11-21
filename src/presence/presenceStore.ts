import type { PresenceState } from "../types.js"

export const presence: Record<string, PresenceState> = {}

export function setOnline(userId: string) {
    presence[userId] = { online: true, lastSeen: null };
}

export function setOffline(userId: string) {
    presence[userId] = { online: false, lastSeen: Date.now() };
}

export function getPresence(userId: string) {
    return presence[userId]
}

export function getOnlineUsers(): string[] {
    return Object.entries(presence)
        .filter(([_, p]) => p.online)
        .map(([userId]) => userId);
}