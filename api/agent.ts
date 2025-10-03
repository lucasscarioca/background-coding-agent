import { bgCodingAgent } from '../utils/bg-agent'

type RequestPayload = { prompt: string; repoUrl: string }

export async function POST(request: Request) {
	const { prompt, repoUrl }: RequestPayload = await request.json()

	try {
		const { response } = await bgCodingAgent(prompt, repoUrl)
		return new Response(JSON.stringify({ prompt, response, repoUrl }), {
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (e) {
		console.error(e)
		return new Response(JSON.stringify({ error: 'An error occurred' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
