import { getAuditLogs, getAllAuditLogs } from '../models/auditTrail.js';

export function getLogs(req, res) {
  try {
    const { sessionId } = req.query;
    const logs = sessionId ? getAuditLogs(sessionId) : getAllAuditLogs();
    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
