// Serverless function — runs on Vercel's servers, NOT in the browser.
// This keeps the Anthropic API key secret.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobDescription, companyName, questions, responses } = req.body || {};

  if (!jobDescription || !questions || !responses) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
  }

  const qa = questions
    .map(
      (q, i) =>
        `Q${i + 1} (${q.category}): ${q.question}\nAnswer: ${
          responses[i] || "[no answer given]"
        }`
    )
    .join("\n\n");

  const prompt = `You are an experienced hiring manager who has just finished interviewing a candidate for this role.${
    companyName ? ` Company: ${companyName}.` : ""
  }

JOB DESCRIPTION:
${jobDescription}

INTERVIEW TRANSCRIPT:
${qa}

Assess honestly and directly. Do not soften feedback. Score each answer out of 10, give an overall verdict and score out of 100, identify what worked and what cost the candidate. Reference the actual content of their answers.

Keep each feedback string to 1-2 sentences. Lists should have 2-4 items max.

Verdict criteria:
- "pass": progress this candidate (overall >= 75)
- "borderline": only if shortlist allows (overall 55-74)
- "fail": don't move forward (overall < 55)

Return ONLY a valid JSON object, no preamble or markdown:
{
  "verdict": "pass" | "borderline" | "fail",
  "overallScore": 0-100,
  "summary": "2-3 sentence overall verdict",
  "strengths": ["specific thing they did well"],
  "weaknesses": ["specific thing that hurt them"],
  "perQuestion": [
    {"questionId": 1, "score": 0-10, "feedback": "honest specific feedback"}
  ]
}`;

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
        max_tokens: 4000,
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
