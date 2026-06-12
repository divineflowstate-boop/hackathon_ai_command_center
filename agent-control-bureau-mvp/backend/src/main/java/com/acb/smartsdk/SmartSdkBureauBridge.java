package com.acb.smartsdk;

import java.util.Map;

/**
 * SmartSDK integration seam for JPMC.
 *
 * For this hackathon MVP, /api/bureau/ask uses deterministic SQL-backed answers
 * inside AcbController so the demo runs without internal dependencies.
 *
 * In JPMC VDI, replace the mock Ask Bureau branch with a SmartSDK Java agent and
 * expose the Spring APIs as SmartSDK tools:
 *
 * - getAgents()
 * - getAgentDetails(agentId)
 * - getPendingApprovals()
 * - getTopTokenConsumers(range)
 * - getCostByLob(range)
 * - getAgentsByModel(model)
 * - getAgentsByTool(toolName)
 * - getDuplicateAgentCandidates()
 *
 * SmartSDK should orchestrate the question, call tools, and return a concise
 * executive answer plus structured data for the UI response card.
 */
public interface SmartSdkBureauBridge {
    Map<String, Object> ask(String question);
}
