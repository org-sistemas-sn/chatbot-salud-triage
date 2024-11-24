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
  // Handle initial webhook validation request from gupshup
  if (req.body.type === 'user-event' && req.body.payload?.type === 'sandbox-start') {
    console.log(success('Webhook validation successful'))
    return res.status(200).json({ message: 'Webhook validation successful' })
  }

  //only accept text messages
  const prompt = req.body.payload?.payload?.text || null
  const sender = req.body.payload.sender

  console.log(info('PROMPT: '), prompt)
  console.log(info('SENDER: '), sender)
  
  try {
    //buscar usuario
    const senderRecord = await Sender.findOne({
      where: { phone: sender.phone },
    })


    if (!senderRecord) {
      //si no existe el usuario
      console.log(info('No sender found, creating new sender'))
      //crear usuario
      const newSenderRecord = await Sender.create({
        phone: sender.phone,
        name: sender.name,
        country_code: sender.country_code,
        dial_code: sender.dial_code,
      })

      //crear thread
      const thread = await openai.beta.threads.create()
      console.log(info('New thread created: '), thread)

      //guardar thread y usuario en la base de datos
      const newThreadRecord = await Thread.create({
        sender_id: newSenderRecord.id,
        thread_id: thread.id,
      })

      console.log(info('New thread record created: '), newThreadRecord)

      //agregar mensaje al thread
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: prompt,
      })
      console.log(info('Message added to thread'))

      //run thread
      await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: ASSISTANT_ID,
      })
      console.log(info('Thread run'))

      //get messages
      const messages = await openai.beta.threads.messages.list(thread.id)

      //enviar mensaje al usuario por wsp
      sendWhatsAppMessage(
        newSenderRecord.phone,
        messages.data[0].content[0].text.value
      )
      console.log(success('Whatsapp message sent to user'))
    } else {
      //si existe
      console.log(success('Sender found: '), senderRecord)
      //buscar el thread en la db
      const threadRecord = await Thread.findOne({
        where: { sender_id: senderRecord.id },
      })

      console.log(success('Thread found: '), threadRecord)

      //buscar thread en openai
      const thread = await openai.beta.threads.retrieve(threadRecord.thread_id)
      console.log(success('Thread found in OpenAI: '), thread)

      // si el thread no existe crearlo
      if (!thread) {
        console.log(info('Thread not found, creating new thread'))
        const newThread = await openai.beta.threads.create()

        //guardar thread en la base de datos
        await Thread.update(
          { thread_id: newThread.id },
          {
            where: { sender_id: senderRecord.id },
          }
        )
        console.log(success('New thread created: '), newThread.id)

        //agregar mensaje al thread
        await openai.beta.threads.messages.create(newThread.id, {
          role: 'user',
          content: prompt,
        })
        console.log(success('Message added to thread'))

        //run thread
        await openai.beta.threads.runs.createAndPoll(newThread.id, {
          assistant_id: ASSISTANT_ID,
        })
        console.log(success('Thread run'))

        //get messages
        const messages = await openai.beta.threads.messages.list(newThread.id)

        //enviar mensaje al usuario por wsp
        sendWhatsAppMessage(
          senderRecord.phone,
          messages.data[0].content[0].text.value
        )
        console.log(success('Whatsapp message sent to user'))
      } else {
        //agregar mensaje al thread
        await openai.beta.threads.messages.create(threadRecord.thread_id, {
          role: 'user',
          content: prompt,
        })
        console.log(success('Message added to thread'))

        //run thread
        await openai.beta.threads.runs.createAndPoll(threadRecord.thread_id, {
          assistant_id: ASSISTANT_ID,
        })
        console.log(success('Thread run'))

        //get messages
        const messages = await openai.beta.threads.messages.list(
          threadRecord.thread_id
        )

        //enviar mensaje al usuario por wsp
        sendWhatsAppMessage(
          senderRecord.phone,
          messages.data[0].content[0].text.value
        )
        console.log(success('Whatsapp message sent to user'))
      }
    }

    res.status(200)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

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
