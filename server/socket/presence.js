/**
 * In-memory presence tracker. Maps a user id to their live socket
 * connections and last-seen time. Multiple tabs/devices are supported via a
 * connection set; a user is "offline" only once every connection drops.
 */
const online = new Map(); // userId -> { role, connections: Set<socketId>, lastSeen: Date }

function markOnline(userId, role, socketId) {
  let entry = online.get(userId);
  if (!entry) {
    entry = { role, connections: new Set(), lastSeen: new Date() };
    online.set(userId, entry);
  }
  entry.role = role;
  entry.connections.add(socketId);
  return entry.connections.size === 1; // true => transitioned offline->online
}

function markOffline(userId, socketId) {
  const entry = online.get(userId);
  if (!entry) return { nowOffline: false, lastSeen: new Date() };
  entry.connections.delete(socketId);
  entry.lastSeen = new Date();
  if (entry.connections.size === 0) {
    online.delete(userId);
    return { nowOffline: true, lastSeen: entry.lastSeen };
  }
  return { nowOffline: false, lastSeen: entry.lastSeen };
}

function isOnline(userId) {
  return online.has(userId);
}

function getLastSeen(userId) {
  const entry = online.get(userId);
  return entry ? entry.lastSeen : null;
}

function onlineUserIds() {
  return [...online.keys()];
}

/** True if any admin/staff user currently has a live connection. */
function anyStaffOnline() {
  for (const entry of online.values()) {
    if (entry.role === 'admin' || entry.role === 'staff') return true;
  }
  return false;
}

module.exports = { markOnline, markOffline, isOnline, getLastSeen, onlineUserIds, anyStaffOnline };
