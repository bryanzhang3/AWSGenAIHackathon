/**
 * Cloudflare AI Agent for VibeCAD
 * Text-to-CAD generation using Workers AI (Llama 3.3)
 */

export interface Env {
	AI: any; // Workers AI binding
	CONVERSATIONS: DurableObjectNamespace; // Durable Object for conversation state
	ONSHAPE_ACCESS_KEY: string;
	ONSHAPE_SECRET_KEY: string;
}

// System prompt for CAD generation
const SYSTEM_PROMPT = `You are an expert CAD designer and OpenSCAD programmer. Your job is to help users create 3D CAD models by generating OpenSCAD code based on their natural language descriptions.

CRITICAL RULES:
1. ALWAYS generate OpenSCAD code, NEVER raw STL data
2. Use proper OpenSCAD syntax with primitives like cylinder(), cube(), sphere()
3. Use transformations: translate(), rotate(), scale()
4. Use boolean operations: union(), difference(), intersection()
5. Create parametric designs with variables when appropriate
6. Wrap your OpenSCAD code in \`\`\`openscad code blocks

OPENSCAD BASICS:
- cylinder(h=height, r=radius, center=true/false)
- cube([width, depth, height], center=true/false)
- sphere(r=radius)
- translate([x, y, z]) object;
- rotate([x_deg, y_deg, z_deg]) object;
- union() { object1; object2; }
- difference() { object1; object2; }

EXAMPLE - Simple gear:
\`\`\`openscad
module gear(teeth=10, radius=20, height=5) {
    linear_extrude(height=height) {
        circle(r=radius);
    }
}
gear(teeth=15, radius=30, height=10);
\`\`\`

Always explain what your design does and provide clean, well-commented OpenSCAD code.`;

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Health check
		if (url.pathname === '/health') {
			return new Response(JSON.stringify({ status: 'ok' }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Chat endpoint
		if (url.pathname === '/api/chat' && request.method === 'POST') {
			try {
				const { message, conversationId } = await request.json() as {
					message: string;
					conversationId?: string
				};

				// Get or create conversation state using Durable Object
				const id = conversationId
					? env.CONVERSATIONS.idFromString(conversationId)
					: env.CONVERSATIONS.newUniqueId();

				const conversation = env.CONVERSATIONS.get(id);

				// Get conversation history
				const historyResponse = await conversation.fetch(
					new Request('http://internal/history', { method: 'GET' })
				);
				const history = await historyResponse.json() as Array<{ role: string; content: string }>;

				// Add new message to history
				history.push({ role: 'user', content: message });

				// Prepare messages for Llama
				const messages = [
					{ role: 'system', content: SYSTEM_PROMPT },
					...history
				];

				// Call Workers AI with Llama 3.3
				const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
					messages,
					stream: false,
					max_tokens: 2048,
					temperature: 0.7,
				});

				const assistantMessage = response.response || response.result?.response || '';

				// Save assistant response to conversation history
				await conversation.fetch(
					new Request('http://internal/add', {
						method: 'POST',
						body: JSON.stringify({ role: 'assistant', content: assistantMessage }),
					})
				);

				// Extract OpenSCAD code if present
				const openscadMatch = assistantMessage.match(/```openscad\n([\s\S]*?)\n```/);
				const openscadCode = openscadMatch ? openscadMatch[1] : null;

				return new Response(
					JSON.stringify({
						response: assistantMessage,
						conversationId: id.toString(),
						openscadCode,
						timestamp: new Date().toISOString(),
					}),
					{
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			} catch (error) {
				console.error('Error in chat endpoint:', error);
				return new Response(
					JSON.stringify({
						error: 'Failed to process chat request',
						details: error instanceof Error ? error.message : String(error)
					}),
					{
						status: 500,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}
		}

		// Streaming chat endpoint
		if (url.pathname === '/api/chat/stream' && request.method === 'POST') {
			try {
				const { message, conversationId } = await request.json() as {
					message: string;
					conversationId?: string
				};

				// Get or create conversation state
				const id = conversationId
					? env.CONVERSATIONS.idFromString(conversationId)
					: env.CONVERSATIONS.newUniqueId();

				const conversation = env.CONVERSATIONS.get(id);

				// Get conversation history
				const historyResponse = await conversation.fetch(
					new Request('http://internal/history', { method: 'GET' })
				);
				const history = await historyResponse.json() as Array<{ role: string; content: string }>;

				// Add new message
				history.push({ role: 'user', content: message });

				// Prepare messages
				const messages = [
					{ role: 'system', content: SYSTEM_PROMPT },
					...history
				];

				// Create readable stream for SSE
				const { readable, writable } = new TransformStream();
				const writer = writable.getWriter();
				const encoder = new TextEncoder();

				// Start streaming response
				ctx.waitUntil((async () => {
					try {
						const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
							messages,
							stream: true,
							max_tokens: 2048,
							temperature: 0.7,
						});

						let fullResponse = '';

						// Stream the response
						for await (const chunk of response) {
							const content = chunk.response || '';
							fullResponse += content;

							await writer.write(
								encoder.encode(`data: ${JSON.stringify({ content, done: false })}\n\n`)
							);
						}

						// Save to conversation history
						await conversation.fetch(
							new Request('http://internal/add', {
								method: 'POST',
								body: JSON.stringify({ role: 'assistant', content: fullResponse }),
							})
						);

						// Send final message
						await writer.write(
							encoder.encode(`data: ${JSON.stringify({
								content: '',
								done: true,
								conversationId: id.toString()
							})}\n\n`)
						);
					} catch (error) {
						console.error('Streaming error:', error);
						await writer.write(
							encoder.encode(`data: ${JSON.stringify({
								error: 'Stream failed',
								details: error instanceof Error ? error.message : String(error)
							})}\n\n`)
						);
					} finally {
						await writer.close();
					}
				})());

				return new Response(readable, {
					headers: {
						...corsHeaders,
						'Content-Type': 'text/event-stream',
						'Cache-Control': 'no-cache',
						'Connection': 'keep-alive',
					},
				});
			} catch (error) {
				console.error('Error in streaming endpoint:', error);
				return new Response(
					JSON.stringify({
						error: 'Failed to start stream',
						details: error instanceof Error ? error.message : String(error)
					}),
					{
						status: 500,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}
		}

		// Clear conversation
		if (url.pathname === '/api/conversation/clear' && request.method === 'POST') {
			try {
				const { conversationId } = await request.json() as { conversationId: string };
				const id = env.CONVERSATIONS.idFromString(conversationId);
				const conversation = env.CONVERSATIONS.get(id);

				await conversation.fetch(
					new Request('http://internal/clear', { method: 'POST' })
				);

				return new Response(
					JSON.stringify({ success: true }),
					{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			} catch (error) {
				return new Response(
					JSON.stringify({ error: 'Failed to clear conversation' }),
					{
						status: 500,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					}
				);
			}
		}

		return new Response('Not Found', { status: 404, headers: corsHeaders });
	},
};

// Durable Object for conversation state/memory
export class ConversationState {
	private state: DurableObjectState;
	private history: Array<{ role: string; content: string }> = [];

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// Initialize history from storage
		if (this.history.length === 0) {
			const stored = await this.state.storage.get<Array<{ role: string; content: string }>>('history');
			if (stored) {
				this.history = stored;
			}
		}

		// Get conversation history
		if (url.pathname === '/history' && request.method === 'GET') {
			return new Response(JSON.stringify(this.history), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Add message to history
		if (url.pathname === '/add' && request.method === 'POST') {
			const message = await request.json() as { role: string; content: string };
			this.history.push(message);
			await this.state.storage.put('history', this.history);

			return new Response(JSON.stringify({ success: true }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Clear history
		if (url.pathname === '/clear' && request.method === 'POST') {
			this.history = [];
			await this.state.storage.delete('history');

			return new Response(JSON.stringify({ success: true }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response('Not Found', { status: 404 });
	}
}
