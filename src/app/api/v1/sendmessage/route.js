// app/api/send-whatsapp/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { phoneNo, message } = await request.json()

  // Validate input
  if (!phoneNo || !message) {
    return NextResponse.json(
      { error: 'phoneNo and message are required' },
      { status: 400 }
    )
  }

  const dataSending = {
    api_key: process.env.WATZAP_API_KEY,
    number_key: process.env.WATZAP_NUMBER_KEY,
    phone_no: phoneNo,
    message: message,
  }

  try {
    const response = await fetch('https://api.watzap.id/v1/send_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataSending)
    })

    if (!response.ok) {
      throw new Error(`Watzap API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    )
  }
}