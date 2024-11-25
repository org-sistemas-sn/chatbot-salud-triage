import OpenAI from 'openai'
import dotenv from 'dotenv'
import Thread from '../Threads/thread.model.js'
import { sendWhatsAppMessage } from '../../lib/sendWhatsapp.js'
import Sender from '../Senders/sender.model.js'
import chalk from 'chalk'

dotenv.config()

const error = chalk.bold.red
const success = chalk.bold.green
const info = chalk.bold.blue

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ASSISTANT_ID = process.env.ASSISTANT_ID

export const healthCheck = (req, res) => {
  console.log(success('Chatbot is running (v1.0.0)'))
  res.json({ message: 'Chatbot is running (v1.0.0)' })
}

export const getThreadMessages = async (req, res) => {
  const { thread_id } = req.params

  try {
    const threadMessages = await openai.beta.threads.messages.list(thread_id)

    res.json(threadMessages.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const killThread = async (req, res) => {
  const { thread_id } = req.params

  try {
    const thread = await openai.beta.threads.del(thread_id)

    res.json(thread)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const postMessage = async (req, res) => {
  if (req.body.type === 'user-event' && req.body.payload?.type === 'sandbox-start') {
    console.log('Webhook validation successful');
    return res.status(200).json({ message: 'Webhook validation successful' });
  }

  const prompt = req.body.payload?.payload?.text || null;
  const sender = req.body.payload.sender;

  if (!prompt) {
    return res.status(400).json({ error: 'No text prompt provided' });
  }

  // Acknowledge the request
  res.status(200).json({ message: 'Message received' });

  try {
    console.time('Total Processing Time');
    console.log('Processing message...');
    console.log('PROMPT:', prompt);
    console.log('SENDER:', sender);

    // Check if sender exists
    let senderRecord = await Sender.findOne({ where: { phone: sender.phone } });

    if (!senderRecord) {
      senderRecord = await Sender.create({
        phone: sender.phone,
        name: sender.name,
        country_code: sender.country_code,
        dial_code: sender.dial_code,
      });
    }

    let threadRecord = await Thread.findOne({ where: { sender_id: senderRecord.id } });
    let threadId;

    if (!threadRecord) {
      console.log('Creating a new thread...');
      const run = await openai.beta.threads.createAndRun({
        assistant_id: ASSISTANT_ID,
        thread: {
          messages: [{ role: 'user', content: prompt }],
        },
      });

      threadId = run.thread_id;

      // Save the new thread in the database
      await Thread.create({
        id: threadId,
        sender_id: senderRecord.id,
      });

      // Get the assistant's reply
      const reply = run.data.messages[0]?.content[0]?.text?.value || 'No response';
      await sendWhatsAppMessage(senderRecord.phone, reply);
    } else {
      console.log('Using existing thread...');
      threadId = threadRecord.id;

      // Add the message and run the thread in one step
      const run = await openai.beta.threads.createAndRun({
        assistant_id: ASSISTANT_ID,
        thread: {
          id: threadId,
          messages: [{ role: 'user', content: prompt }],
        },
      });

      // Get the assistant's reply
      const reply = run.data.messages[0]?.content[0]?.text?.value || 'No response';
      await sendWhatsAppMessage(senderRecord.phone, reply);
    }

    console.timeEnd('Total Processing Time');
  } catch (error) {
    console.error('Error processing message:', error.message);
  }
};



// thread_qFlpghaKjnljBR6h6Ac7H9N3 old thread to test data persistence

// const bodyy = {
//   app: 'ChatbotSalud',
//   timestamp: 1732133464721,
//   version: 2,
//   type: 'message',
//   payload: {
//     id: 'wamid.HBgNNTQ5MzM2NDQ5Njc1NhUCABIYFDNBMkY1NTc0NjBGMkI3OUFEODAyAA==',
//     source: '5493364496756',
//     type: 'text',
//     payload: { text: 'test' },
//     sender: {
//       phone: '5493364496756',
//       name: 'Alfredo Canto',
//       country_code: '54',
//       dial_code: '93364496756'
//     }
//   }
// }
