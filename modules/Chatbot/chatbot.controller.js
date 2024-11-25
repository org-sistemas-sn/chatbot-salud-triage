import OpenAI from 'openai'
import dotenv from 'dotenv'
import Thread from '../Threads/thread.model.js'
import { sendWhatsAppMessage } from '../../lib/sendWhatsapp.js'
import Sender from '../Senders/sender.model.js'
import chalk from 'chalk'

//------------------------------------------------------------------------------------------
// Handle webhook validation request
// this option should only be added at the top of the postMessage endpoint
// when changin the callback url from gupshup
// the condition should not be added to avoid innecesary webook validation :P
//------------------------------------------------------------------------------------------

// if (req.body.type === 'user-event' && req.body.payload?.type === 'sandbox-start') {
//   console.log('Webhook validation successful');
//   return res.status(200).json({ message: 'Webhook validation successful' });
// }

dotenv.config()


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
      senderRecord = await Sender.create({
        phone: sender.phone,
        name: sender.name,
        country_code: sender.country_code,
        dial_code: sender.dial_code,
      })
    }

    let threadRecord = await Thread.findOne({
      where: { sender_id: senderRecord.id },
    })

    if (!threadRecord) {
      threadRecord = await openai.beta.threads.create()

      await Thread.create({
        id: threadRecord.id,
        sender_id: senderRecord.id,
      })
    }

    await openai.beta.threads.messages.create(threadRecord.id, {
      role: 'user',
      content: prompt,
    })

    await openai.beta.threads.runs.createAndPoll(
      threadRecord.id,
      { assistant_id: ASSISTANT_ID }
    )

    const messages = await openai.beta.threads.messages.list(threadRecord.id)
    let response = messages.data[0].content[0].text.value

    sendWhatsAppMessage(senderRecord.phone, response)

  } catch (error) {
    console.error('Error processing message:', error.message)
  }
}

