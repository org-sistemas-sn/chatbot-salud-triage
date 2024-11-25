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

export const postMessage = async (req, res) => {
  // Only accept text messages
  const prompt = req.body.payload?.payload?.text || null
  const sender = req.body.payload.sender

  if (!prompt) {
    return res.status(400).json({ error: 'No text prompt provided' })
  }

  // Send immediate acknowledgment response
  res.status(200).json({ message: 'Message received' })

  try {
    let senderRecord = await Sender.findOne({ where: { phone: sender.phone } })

    if (!senderRecord) {
      console.log(info('No sender found, creating new sender...'))
      senderRecord = await Sender.create({
        phone: sender.phone,
        name: sender.name,
        country_code: sender.country_code,
        dial_code: sender.dial_code,
      })
    }

    console.log(info('Sender:', senderRecord))

    let threadRecord = await Thread.findOne({
      where: { sender_id: senderRecord.id },
    })

    if (!threadRecord) {
      threadRecord = await openai.beta.threads.create()
      console.log('New thread created:', threadRecord.id)

      await Thread.create({
        id: threadRecord.id,
        sender_id: senderRecord.id,
      })
      console.log(info('Thread record save to db:', threadRecord.id))
    }

    await openai.beta.threads.messages.create(threadRecord.id, {
      role: 'user',
      content: prompt,
    })
    console.log(info('Message sent to thread:', prompt))

    await openai.beta.threads.runs.createAndPoll(
      threadRecord.id,
      { assistant_id: ASSISTANT_ID }
    )

    console.log(info('Message processed by OpenAI'))

    const messages = await openai.beta.threads.messages.list(threadRecord.id)
    let response = messages.data[0].content[0].text.value

    sendWhatsAppMessage(senderRecord.phone, response)

  } catch (error) {
    console.error('Error processing message:', error.message)
  }
}

// Handle webhook validation request
// if (req.body.type === 'user-event' && req.body.payload?.type === 'sandbox-start') {
//   console.log('Webhook validation successful');
//   return res.status(200).json({ message: 'Webhook validation successful' });
// }
