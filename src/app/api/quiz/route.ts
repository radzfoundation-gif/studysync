import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

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
            content: `You are an expert quiz generator for teachers. The user will give you a topic. You must generate a fun, engaging, and challenging multiple-choice quiz about that topic in INDONESIAN language. 
            Return ONLY a valid JSON array of objects representing the questions. Do not include markdown code blocks or any other text outside the JSON array.
            Format of each object: 
            {
              "question": "The question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0 // index of the correct option (0-3)
            }
            Generate exactly 3 questions.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch from SumoPod API');
    }

    const content = data.choices[0].message.content;
    let quizData;
    try {
      // Remove any markdown formatting if the AI decided to ignore the instructions
      const cleanContent = content.replace(/```json\n|\n```|```/g, '').trim();
      quizData = JSON.parse(cleanContent);
    } catch (e) {
       console.error("Failed to parse AI response as JSON:", content);
       throw new Error('AI returned an invalid quiz format. Please try again.');
    }

    return NextResponse.json({ questions: quizData });
  } catch (error: any) {
    console.error('Quiz API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
