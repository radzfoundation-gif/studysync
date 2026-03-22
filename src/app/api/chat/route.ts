import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.SUMOPOD_API_KEY) {
      return NextResponse.json({ error: 'SUMOPOD_API_KEY is not set' }, { status: 500 });
    }

    const response = await fetch('https://ai.sumopod.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUMOPOD_API_KEY}`
      },
      body: JSON.stringify({
        model: 'seed-2-0-lite-free',
        messages: [
          {
            role: 'system',
            content: 'You are StudySync AI Tutor, a helpful, friendly, and concise academic assistant. You help students understand their notes better, clarify concepts, and answer questions. Keep your answers brief and in Indonesian.'
          },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch from SumoPod API');
    }

    return NextResponse.json({ message: data.choices[0].message.content });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
