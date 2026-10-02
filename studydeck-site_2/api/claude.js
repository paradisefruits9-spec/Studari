// Serverless function (Vercel Node.js runtime) that proxies requests to the
// Anthropic Messages API. The API key lives ONLY here, as a server-side
// environment variable — it is never sent to the browser.
//
// Expects POST JSON: { system?: string, messages: [{role, content}], model?: string, maxTokens?: number }
// Returns: { text: string }  on success
//          { error: string, code: string, detail?: string } on failure

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";
const DEFAULT_MAX_TOKENS = 2000;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", code: "bad_method" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Server is missing ANTHROPIC_API_KEY",
      code: "server_error",
      detail: "Set ANTHROPIC_API_KEY in your hosting provider's environment variables, then redeploy. See README.md.",
    });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    res.status(400).json({ error: "messages is required (a non-empty array)", code: "bad_request" });
    return;
  }
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string" || !m.content) {
      res.status(400).json({ error: "each message needs role 'user'|'assistant' and non-empty string content", code: "bad_request" });
      return;
    }
  }
  if (messages[0].role !== "user") {
    res.status(400).json({ error: "messages must start with a 'user' turn", code: "bad_request" });
    return;
  }

  const payload = {
    model: typeof body.model === "string" && body.model ? body.model : DEFAULT_MODEL,
    max_tokens: Number.isFinite(body.maxTokens) ? Math.min(Math.max(body.maxTokens, 1), 8000) : DEFAULT_MAX_TOKENS,
    messages: messages.map(function (m) { return { role: m.role, content: m.content }; }),
  };
  if (typeof body.system === "string" && body.system) {
    payload.system = body.system;
  }

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    res.status(502).json({ error: "Could not reach Anthropic's API", code: "network_error", detail: String(networkErr && networkErr.message || networkErr) });
    return;
  }

  let data;
  try {
    data = await upstream.json();
  } catch (parseErr) {
    res.status(502).json({ error: "Anthropic returned a non-JSON response", code: "server_error" });
    return;
  }

  if (!upstream.ok) {
    const errType = data && data.error && data.error.type;
    const code = errType === "rate_limit_error" ? "rate_limited"
      : errType === "authentication_error" ? "server_error"
      : errType === "overloaded_error" ? "rate_limited"
      : "server_error";
    res.status(upstream.status).json({
      error: (data && data.error && data.error.message) || "Anthropic API error",
      code: code,
      detail: errType || null,
    });
    return;
  }

  const text = Array.isArray(data.content)
    ? data.content.map(function (block) { return block && block.type === "text" ? block.text : ""; }).join("")
    : "";

  if (!text) {
    res.status(502).json({ error: "Empty response from the model", code: "server_error" });
    return;
  }

  res.status(200).json({ text: text });
};
