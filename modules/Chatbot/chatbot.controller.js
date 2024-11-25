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
  // Handle webhook validation request
  if (req.body.type === 'user-event' && req.body.payload?.type === 'sandbox-start') {
    console.log('Webhook validation successful');
    return res.status(200).json({ message: 'Webhook validation successful' });
  }

  // Only accept text messages
  const prompt = req.body.payload?.payload?.text || null;
  const sender = req.body.payload.sender;

  let request = req.body 

  console.log(error('REQUEST:'), request)

  if (!prompt) {
    return res.status(400).json({ error: 'No text prompt provided' });
  }

  // Send immediate acknowledgment response
  res.status(200).json({ message: 'Message received' });

  // Process message asynchronously
  try {
    console.log('Processing message...');
    console.log('PROMPT:', prompt);
    console.log('SENDER:', sender);

    // Check if the sender already exists
    let senderRecord = await Sender.findOne({ where: { phone: sender.phone } });

    if (!senderRecord) {
      console.log('No sender found, creating new sender...');
      senderRecord = await Sender.create({
        phone: sender.phone,
        name: sender.name,
        country_code: sender.country_code,
        dial_code: sender.dial_code,
      });

      const thread = await openai.beta.threads.create();
      console.log('New thread created:', thread);

      await Thread.create({
        id: thread.id,
        sender_id: senderRecord.id,
      });

      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: prompt,
      });

      await openai.beta.threads.runs.createAndPoll(thread.id, { assistant_id: ASSISTANT_ID });

      const messages = await openai.beta.threads.messages.list(thread.id);
      sendWhatsAppMessage(senderRecord.phone, messages.data[0].content[0].text.value);

      console.log('WhatsApp message sent to user');
    } else {
      console.log('Sender found:', senderRecord);

      let threadRecord = await Thread.findOne({ where: { sender_id: senderRecord.id } });

      if (!threadRecord) {
        console.log('No thread found, creating new thread...');
        const newThread = await openai.beta.threads.create();

        threadRecord = await Thread.create({
          id: newThread.id,
          sender_id: senderRecord.id,
        });

        await openai.beta.threads.messages.create(newThread.id, {
          role: 'user',
          content: prompt,
        });

        await openai.beta.threads.runs.createAndPoll(newThread.id, { assistant_id: ASSISTANT_ID });

        const messages = await openai.beta.threads.messages.list(newThread.id);
        sendWhatsAppMessage(senderRecord.phone, messages.data[0].content[0].text.value);

        console.log('WhatsApp message sent to user');
      } else {
        console.log('Thread found:', threadRecord);

        await openai.beta.threads.messages.create(threadRecord.id, {
          role: 'user',
          content: prompt,
        });

        await openai.beta.threads.runs.createAndPoll(threadRecord.id, { assistant_id: ASSISTANT_ID });

        const messages = await openai.beta.threads.messages.list(threadRecord.id);
        sendWhatsAppMessage(senderRecord.phone, messages.data[0].content[0].text.value);

        console.log('WhatsApp message sent to user');
      }
    }
  } catch (error) {
    console.error('Error processing message:', error.message);
    // Note: No need to send a response here, as it was already sent earlier.
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
