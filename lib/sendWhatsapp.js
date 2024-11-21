import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// https://docs.gupshup.io/reference/msg

export async function sendWhatsAppMessage(destinationNumber, messageText) {
  const apiKey = process.env.GUPSHUP_API_KEY
  const sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER
  const appName = process.env.GUPSHUP_APP_NAME
  const url = process.env.GUPSHUP_API_URL

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'apikey': apiKey,
  };

  const data = new URLSearchParams({
    channel: '',
    source: sourceNumber,
    destination: destinationNumber,
    'src.name': appName,
    message: JSON.stringify({
      type: 'text',
      text: messageText,
    }),
  });

  try {
    const response = await axios.post(url, data.toString(), { headers });
    console.log('Message sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}

