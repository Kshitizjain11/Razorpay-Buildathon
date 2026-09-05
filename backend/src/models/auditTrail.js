import { v4 as uuidv4 } from 'uuid';

// In-memory audit trail array
const auditLogs = [];

export function addAuditLog({ sessionId, event, payload, source = "human" }) {
  const logEntry = {
    id: `audit-${uuidv4().slice(0, 8)}`,
    sessionId: sessionId || 'default-session',
    timestamp: new Date().toISOString(),
    event,
    payload,
    source // "human" | "agent-api"
  };

  auditLogs.unshift(logEntry); // Most recent first
  return logEntry;
}

export function getAuditLogs(sessionId) {
  if (!sessionId) return auditLogs;
  return auditLogs.filter(log => log.sessionId === sessionId);
}

export function getAllAuditLogs() {
  return auditLogs;
}
