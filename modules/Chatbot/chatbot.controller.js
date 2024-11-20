import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID; // may be dinamic in the future

export const postMessage = async (req, res) => {
  const { prompt } = req.body;
  
  try {
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(
      thread.id,
      { role: "user", content: prompt }
    );

    await openai.beta.threads.runs.createAndPoll(
      thread.id,
      { assistant_id: ASSISTANT_ID }
    );
  
    const messages = await openai.beta.threads.messages.list(
      thread.id
    )

    res.json(messages.data)

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getThreadMessages = async (req, res) => {
  const { thread_id } = req.params;

  try {
    const threadMessages = await openai.beta.threads.messages.list(
      thread_id
    );

    res.json(threadMessages.data)

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const killThread = async (req, res) => {
  const { thread_id } = req.params;

  try {
    const thread = await openai.beta.threads.del(
      thread_id
    );

    res.json(thread)

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// thread_qFlpghaKjnljBR6h6Ac7H9N3 old thread to test data persistence