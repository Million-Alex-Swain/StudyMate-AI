// server.js
// Backend proxy for the StudyMate AI tutor chat. Calls Groq's free API.

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are StudyMate AI, a patient, encouraging personal tutor.
Explain concepts step by step using simple, everyday examples.
Keep answers short and focused — a few sentences or steps at a time, not a wall of text.
After explaining, briefly check the student's understanding with a quick question when it fits naturally.
Adapt your depth to how the student responds: simplify further if they seem confused, go deeper if they seem confident.`;

// ---------------------------------------------------
// NEW FIX: This safely checks for your API key without 
// crashing the entire server!
// ---------------------------------------------------
app.get('/', (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    res.send('Server is running, but the GROQ_API_KEY is missing from Wasmer!');
  } else {
    res.send('My StudyMate AI backend is successfully running and the API key is loaded!');
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const API_KEY = process.env.GROQ_API_KEY;

    // Send an error back to the chat window if the key is missing, instead of crashing.
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: Missing API Key in Wasmer' });
    }

    const { messages } = req.body; 

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
