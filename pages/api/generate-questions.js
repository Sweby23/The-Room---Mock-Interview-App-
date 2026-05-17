// Serverless function — runs on Vercel's servers, NOT in the browser.
// This keeps the Anthropic API key secret.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobDescription, companyName } = req.body || {};

  if (!jobDescription || !jobDescription.trim()) {
    return res.status(400).json({ error: "Missing jobDescription" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
  }

  const prompt = `You are an experienced hiring manager preparing 5 interview questions for the role below.${
    companyName ? ` Company: ${companyName}.` : ""
  }

JOB DESCRIPTION:
${jobDescription}

Generate 5 challenging but realistic interview questions a hiring manager would actually ask. Mix categories: at least one behavioural ("tell me about a time..."), one competency/skills-based, one situational/hypothetical, and one motivational ("why this role/company"). Make them specific to the role, not generic.

Return ONLY a valid JSON array, no preamble or markdown:
[{"id":1,"category":"Behavioural","question":"..."},{"id":2,"category":"Competency","question":"..."}]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
