import { processUserMessage } from '../agents/salesAgent.js';
import { extractRequirements, rankRecommendations } from '../services/revenueMaximizerService.js';
import { addAuditLog } from '../models/auditTrail.js';

export async function extractUserRequirements(req, res) {
  try {
    const { text, sessionId = `session-${Date.now()}` } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: "Text prompt is required" });
    }

    const requirements = await extractRequirements(text);
    addAuditLog({
      sessionId,
      event: "REQUIREMENTS_EXTRACTED_DIRECT",
      payload: requirements,
      source: req.headers['x-source'] || "human"
    });

    return res.json({ success: true, sessionId, requirements });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function handleAgentMessage(req, res) {
  try {
    const { message, sessionId = `session-${Date.now()}` } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const source = req.headers['x-source'] || "human";
    const result = await processUserMessage(sessionId, message, source);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
