// server.js
// Backend proxy for the StudyMate AI tutor chat. Calls Groq's free API.
// The API key stays here on the server — never sent to the browser.

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error('Missing GROQ_API_KEY in .env file. Get a free key at https://console.groq.com/keys');
  process.exit(1);
}

const SYSTEM_PROMPT = `You are StudyMate AI, a patient, encouraging personal tutor.
Explain concepts step by step using simple, everyday examples.
Keep answers short and focused — a few sentences or steps at a time, not a wall of text.
After explaining, briefly check the student's understanding with a quick question when it fits naturally.
Adapt your depth to how the student responds: simplify further if they seem confused, go deeper if they seem confident.`;

// ---------------------------------------------------
// NEW FIX: This creates a homepage so you don't see an error 
// when clicking the link in your Wasmer dashboard.
// ---------------------------------------------------
app.get('/', (req, res) => {
  res.send('My StudyMate AI backend is successfully running!');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body; // [{role: "user"/"assistant", content: "..."}, ...]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 600,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error(data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.choices?.[0]?.message?.content || 'No response';
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`StudyMate AI server running on port ${PORT}`));
