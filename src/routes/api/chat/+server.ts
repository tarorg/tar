import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Groq } from 'groq-sdk';
import { GROQ_API_KEY } from '$env/static/private';

interface ChatRequest {
    message: string;
}

interface ChatResponse {
    message: string;
}

export const POST: RequestHandler = async ({ request }) => {
    const groq = new Groq({
        apiKey: GROQ_API_KEY
    });

    try {
        const { message } = await request.json() as ChatRequest;
        
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: message
                }
            ],
            model: "llama-3.3-70b-versatile"
        });

        return json<ChatResponse>({
            message: completion.choices[0].message.content
        });
    } catch (error) {
        console.error('Groq API error:', error);
        return new Response('Error processing request', { status: 500 });
    }
}
