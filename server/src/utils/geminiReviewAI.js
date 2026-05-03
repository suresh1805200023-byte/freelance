const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeReviewWithGemini(review, rating, user, gig) {
  const prompt = `
    Analyze this review for signs of being fake, bot-generated, or incentivized.
    Review: "${review}"
    Rating: ${rating}
    User: ${user}
    Gig: ${gig}
    Return a JSON: { "isSuspicious": true/false, "reason": "..." }
  `;
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    return json;
  } catch (e) {
    return { isSuspicious: false, reason: "AI could not determine." };
  }
}

module.exports = { analyzeReviewWithGemini }; 