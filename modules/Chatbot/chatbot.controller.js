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

  let request = req.body;

  console.log('REQUEST:', request);

  if (!prompt) {
    return res.status(400).json({ error: 'No text prompt provided' });
  }

  // Send immediate acknowledgment response
  res.status(200).json({ message: 'Message received' });

  // Process message asynchronously
  try {
    console.time('Total Processing Time');
    console.log('Processing message...');
    console.log('PROMPT:', prompt);
    console.log('SENDER:', sender);

    console.time('Check Sender Existence');
    // Check if the sender already exists
    let senderRecord = await Sender.findOne({ where: { phone: sender.phone } });
    console.timeEnd('Check Sender Existence');

    if (!senderRecord) {
      console.log('No sender found, creating new sender...');
      console.time('Create Sender');
      senderRecord = await Sender.create({
        phone: sender.phone,
        name: sender.name,
        country_code: sender.country_code,
        dial_code: sender.dial_code,
      });
      console.timeEnd('Create Sender');

      console.time('Create Thread');
      const thread = await openai.beta.threads.create();
      console.log('New thread created:', thread);

      await Thread.create({
        id: thread.id,
        sender_id: senderRecord.id,
      });
      console.timeEnd('Create Thread');

      console.time('Add Message to Thread');
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: prompt,
      });
      console.timeEnd('Add Message to Thread');

      console.time('Run Thread');
      await openai.beta.threads.runs.createAndPoll(thread.id, { assistant_id: ASSISTANT_ID });
      console.timeEnd('Run Thread');

      console.time('List Messages');
      const messages = await openai.beta.threads.messages.list(thread.id);
      console.timeEnd('List Messages');

      console.time('Send WhatsApp Message');
      sendWhatsAppMessage(senderRecord.phone, messages.data[0].content[0].text.value);
      console.timeEnd('Send WhatsApp Message');

      console.log('WhatsApp message sent to user');
    } else {
      console.log('Sender found:', senderRecord);

      console.time('Check Thread Existence');
      let threadRecord = await Thread.findOne({ where: { sender_id: senderRecord.id } });
      console.timeEnd('Check Thread Existence');

      if (!threadRecord) {
        console.log('No thread found, creating new thread...');
        console.time('Create New Thread');
        const newThread = await openai.beta.threads.create();

        threadRecord = await Thread.create({
          id: newThread.id,
          sender_id: senderRecord.id,
        });
        console.timeEnd('Create New Thread');

        console.time('Add Message to New Thread');
        await openai.beta.threads.messages.create(newThread.id, {
          role: 'user',
          content: prompt,
        });
        console.timeEnd('Add Message to New Thread');

        console.time('Run New Thread');
        await openai.beta.threads.runs.createAndPoll(newThread.id, { assistant_id: ASSISTANT_ID });
        console.timeEnd('Run New Thread');

        console.time('List Messages from New Thread');
        const messages = await openai.beta.threads.messages.list(newThread.id);
        console.timeEnd('List Messages from New Thread');

        console.time('Send WhatsApp Message from New Thread');
        sendWhatsAppMessage(senderRecord.phone, messages.data[0].content[0].text.value);
        console.timeEnd('Send WhatsApp Message from New Thread');

        console.log('WhatsApp message sent to user');
      } else {
        console.log('Thread found:', threadRecord);

        console.time('Add Message to Existing Thread');
        await openai.beta.threads.messages.create(threadRecord.id, {
          role: 'user',
          content: prompt,
        });
        console.timeEnd('Add Message to Existing Thread');

        console.time('Run Existing Thread');
        await openai.beta.threads.runs.createAndPoll(threadRecord.id, { assistant_id: ASSISTANT_ID });
        console.timeEnd('Run Existing Thread');

        console.time('List Messages from Existing Thread');
        const messages = await openai.beta.threads.messages.list(threadRecord.id);
        console.timeEnd('List Messages from Existing Thread');

        console.time('Send WhatsApp Message from Existing Thread');
        sendWhatsAppMessage(senderRecord.phone, messages.data[0].content[0].text.value);
        console.timeEnd('Send WhatsApp Message from Existing Thread');

        console.log('WhatsApp message sent to user');
      }
    }
    console.timeEnd('Total Processing Time');
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
