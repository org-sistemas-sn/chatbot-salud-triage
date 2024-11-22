import OpenAI from 'openai'
import dotenv from 'dotenv'
import Thread from '../Threads/thread.model.js'
import { sendWhatsAppMessage } from '../../lib/sendWhatsapp.js'
import Sender from '../Senders/sender.model.js'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ASSISTANT_ID = process.env.ASSISTANT_ID

export const healthCheck = (req, res) => {
  res.json({ message: 'Chatbot is running (v1.0.0)' })
}

export const webhook = async (req, res) => {
  res.status(200).json({message: 'test'})
}

export const webhook2 = async (req, res) => {
  res.status(200).json({message: 'test'})
}

export const postMessage = async (req, res) => {
  const { prompt } = req.body

  try {
    const thread = await openai.beta.threads.create()

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: prompt,
    })

    await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: ASSISTANT_ID,
    })

    const messages = await openai.beta.threads.messages.list(thread.id)

    res.json(messages.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
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

// export const postMessage2 = async (req, res) => {
//   // Handle initial webhook validation request
//   if (req.body.type === 'user-event' && req.body.payload?.type === 'sandbox-start') {
//     return res.status(200).json({ message: 'Webhook validation successful' })
//   }

//   //only accept text messages
//   const prompt = req.body.payload?.payload?.text || null
//   const sender = req.body.payload.sender

//   console.log(req.body)
//   console.log('prompt: ', prompt)


//   try {
//     //buscar usuario
//     const senderRecord = await Sender.findOne({
//       where: { phone: sender.phone },
//     })

//     if (!senderRecord) {
//       //si no existe el usuario
//       //crear usuario
//       const newSenderRecord = await Sender.create({
//         phone: sender.phone,
//         name: sender.name,
//         country_code: sender.country_code,
//         dial_code: sender.dial_code,
//       })

//       //crear thread
//       const thread = await openai.beta.threads.create()

//       //guardar thread y usuario en la base de datos
//       const newThreadRecord = await Thread.create({
//         sender_id: newSenderRecord.id,
//         thread_id: thread.id,
//       })

//       //agregar mensaje al thread
//       await openai.beta.threads.messages.create(thread.id, {
//         role: 'user',
//         content: prompt,
//       })

//       //run thread
//       await openai.beta.threads.runs.createAndPoll(thread.id, {
//         assistant_id: ASSISTANT_ID,
//       })

//       //get messages
//       const messages = await openai.beta.threads.messages.list(thread.id)

//       //enviar mensaje al usuario por wsp
//       sendWhatsAppMessage(
//         newSenderRecord.phone,
//         messages.data[0].content[0].text.value
//       )
//     } else {
//       //si existe

//       //buscar el thread en la db
//       const threadRecord = await Thread.findOne({
//         where: { sender_id: senderRecord.id },
//       })

//       //buscar thread en openai
//       const thread = await openai.beta.threads.retrieve(threadRecord.thread_id)

//       // si el thread no existe crearlo
//       if (!thread) {
//         const newThread = await openai.beta.threads.create()

//         //guardar thread en la base de datos
//         await Thread.update(
//           { thread_id: newThread.id },
//           {
//             where: { sender_id: senderRecord.id },
//           }
//         )

//         //agregar mensaje al thread
//         await openai.beta.threads.messages.create(newThread.id, {
//           role: 'user',
//           content: prompt,
//         })

//         //run thread
//         await openai.beta.threads.runs.createAndPoll(newThread.id, {
//           assistant_id: ASSISTANT_ID,
//         })

//         //get messages
//         const messages = await openai.beta.threads.messages.list(newThread.id)

//         //enviar mensaje al usuario por wsp
//         sendWhatsAppMessage(
//           senderRecord.phone,
//           messages.data[0].content[0].text.value
//         )
//       } else {
//         //agregar mensaje al thread
//         await openai.beta.threads.messages.create(threadRecord.thread_id, {
//           role: 'user',
//           content: prompt,
//         })

//         //run thread
//         await openai.beta.threads.runs.createAndPoll(threadRecord.thread_id, {
//           assistant_id: ASSISTANT_ID,
//         })

//         //get messages
//         const messages = await openai.beta.threads.messages.list(
//           threadRecord.thread_id
//         )

//         //enviar mensaje al usuario por wsp
//         sendWhatsAppMessage(
//           senderRecord.phone,
//           messages.data[0].content[0].text.value
//         )
//       }
//     }

//     res.sendStatus(200)
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ error: error.message })
//   }
//}

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
