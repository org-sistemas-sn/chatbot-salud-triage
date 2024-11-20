import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import ChatBotRoutes from './modules/Chatbot/chatbot.routes.js'
import morgan from 'morgan'

const app = express()

dotenv.config()
app.use(cors())
app.use(express.json())

app.use(morgan('combined'))


app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`)
})

app.post('/api/health', (req, res) => {
  res.json({ message: 'Server is up and running', body: req.body })
})
app.use('/api', ChatBotRoutes)


// sequelize
//   .authenticate()
//   .then(() => console.log('Database connected'))
//   .catch((error) => console.error('Unable to connect to the database: ', error))

// sequelize
//   .sync()
//   .then(() => {
//     console.log('Tables created successfully')
//   })
//   .catch((error) => {
//     console.error('Error creating tables:', error)
//   })
