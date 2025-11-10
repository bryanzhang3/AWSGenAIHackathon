/**
 * Fusion 360 API Routes
 * Handles AI-powered CAD code generation
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// Store conversations in memory (use Redis/database for production)
const conversations = new Map();

// Load system prompt
const systemPromptPath = path.join(__dirname, '../prompts/fusion360_system.txt');
let SYSTEM_PROMPT = '';

try {
    SYSTEM_PROMPT = fs.readFileSync(systemPromptPath, 'utf8');
    console.log('✅ Loaded Fusion 360 system prompt');
} catch (error) {
    console.error('❌ Failed to load system prompt:', error.message);
    SYSTEM_PROMPT = 'You are an expert at generating Fusion 360 Python code. Generate only executable code, no markdown or explanations.';
}

/**
 * POST /api/fusion/generate
 * Generate Fusion 360 Python code from natural language
 */
router.post('/generate', async (req, res) => {
    try {
        const { prompt, conversationId } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({
                error: 'Prompt is required and must be a string'
            });
        }

        console.log('\n🎯 Generating code for:', prompt);

        // Get or create conversation
        let conversationHistory = [];
        let convId = conversationId;

        if (convId && conversations.has(convId)) {
            conversationHistory = conversations.get(convId);
            console.log('📝 Continuing conversation:', convId);
        } else {
            convId = generateConversationId();
            conversations.set(convId, []);
            console.log('🆕 New conversation:', convId);
        }

        // Build conversation context
        const messages = [
            ...conversationHistory,
            {
                role: 'user',
                content: prompt
            }
        ];

        // Call Claude API
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',  // Latest Claude Sonnet
            max_tokens: 4096,
            temperature: 0.3,  // Lower temperature for more precise code generation
            system: SYSTEM_PROMPT,
            messages: messages
        });

        // Extract generated code
        const generatedCode = response.content[0].text;

        console.log('✅ Code generated successfully');
        console.log('📏 Code length:', generatedCode.length, 'characters');

        // Update conversation history
        conversationHistory.push(
            { role: 'user', content: prompt },
            { role: 'assistant', content: generatedCode }
        );
        conversations.set(convId, conversationHistory);

        // Clean up old conversations (keep last 100)
        if (conversations.size > 100) {
            const firstKey = conversations.keys().next().value;
            conversations.delete(firstKey);
        }

        // Return response
        res.json({
            code: generatedCode,
            conversationId: convId,
            model: response.model,
            usage: response.usage
        });

    } catch (error) {
        console.error('❌ Error generating code:', error);

        if (error.status === 401) {
            return res.status(500).json({
                error: 'Invalid Anthropic API key. Please check your .env file.'
            });
        }

        if (error.status === 429) {
            return res.status(429).json({
                error: 'Rate limit exceeded. Please try again in a moment.'
            });
        }

        res.status(500).json({
            error: `Failed to generate code: ${error.message}`
        });
    }
});

/**
 * POST /api/fusion/refine
 * Refine existing code based on user feedback
 */
router.post('/refine', async (req, res) => {
    try {
        const { code, feedback, conversationId } = req.body;

        if (!code || !feedback) {
            return res.status(400).json({
                error: 'Both code and feedback are required'
            });
        }

        console.log('\n🔧 Refining code based on:', feedback);

        const refinePrompt = `Here's the current Fusion 360 code:

\`\`\`python
${code}
\`\`\`

User feedback: ${feedback}

Generate the updated code incorporating this feedback. Output ONLY the complete updated Python code, no explanations.`;

        // Use same generation logic
        req.body.prompt = refinePrompt;
        req.body.conversationId = conversationId;

        // Forward to generate endpoint
        router.post('/generate', req, res);

    } catch (error) {
        console.error('❌ Error refining code:', error);
        res.status(500).json({
            error: `Failed to refine code: ${error.message}`
        });
    }
});

/**
 * DELETE /api/fusion/conversation/:id
 * Clear conversation history
 */
router.delete('/conversation/:id', (req, res) => {
    try {
        const { id } = req.params;

        if (conversations.has(id)) {
            conversations.delete(id);
            console.log('🗑️  Cleared conversation:', id);
            res.json({ success: true, message: 'Conversation cleared' });
        } else {
            res.status(404).json({ error: 'Conversation not found' });
        }
    } catch (error) {
        console.error('❌ Error clearing conversation:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/fusion/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    const hasSystemPrompt = SYSTEM_PROMPT.length > 0;

    res.json({
        status: 'ok',
        ready: hasApiKey && hasSystemPrompt,
        checks: {
            anthropicApiKey: hasApiKey,
            systemPrompt: hasSystemPrompt
        },
        conversations: conversations.size
    });
});

// Helper function to generate conversation IDs
function generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default router;
