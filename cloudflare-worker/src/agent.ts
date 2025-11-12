/**
 * Autonomous AI Agent for VibeCAD
 * Implements tool calling, planning, and multi-step execution
 */

export interface Tool {
	name: string;
	description: string;
	parameters: {
		type: string;
		properties: Record<string, any>;
		required: string[];
	};
	execute: (params: any, env: any) => Promise<any>;
}

// Define available tools for the agent
export const TOOLS: Tool[] = [
	{
		name: 'validate_openscad',
		description: 'Validates OpenSCAD code syntax and structure. Returns validation errors or success.',
		parameters: {
			type: 'object',
			properties: {
				code: {
					type: 'string',
					description: 'The OpenSCAD code to validate',
				},
			},
			required: ['code'],
		},
		execute: async (params: { code: string }) => {
			// Basic syntax validation
			const errors: string[] = [];

			// Check for basic syntax errors
			if (!params.code.trim()) {
				errors.push('Code is empty');
			}

			// Check for balanced braces
			const openBraces = (params.code.match(/{/g) || []).length;
			const closeBraces = (params.code.match(/}/g) || []).length;
			if (openBraces !== closeBraces) {
				errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
			}

			// Check for balanced parentheses
			const openParens = (params.code.match(/\(/g) || []).length;
			const closeParens = (params.code.match(/\)/g) || []).length;
			if (openParens !== closeParens) {
				errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
			}

			// Check for balanced square brackets
			const openBrackets = (params.code.match(/\[/g) || []).length;
			const closeBrackets = (params.code.match(/\]/g) || []).length;
			if (openBrackets !== closeBrackets) {
				errors.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
			}

			// Check for semicolons after statements (common patterns)
			const lines = params.code.split('\n');
			lines.forEach((line, idx) => {
				const trimmed = line.trim();
				if (trimmed &&
					!trimmed.startsWith('//') &&
					!trimmed.startsWith('module') &&
					!trimmed.startsWith('function') &&
					!trimmed.endsWith('{') &&
					!trimmed.endsWith('}') &&
					trimmed !== '}' &&
					(trimmed.includes('cube') || trimmed.includes('cylinder') || trimmed.includes('sphere') ||
					 trimmed.includes('translate') || trimmed.includes('rotate') || trimmed.includes('scale')) &&
					!trimmed.endsWith(';')) {
					errors.push(`Line ${idx + 1} missing semicolon: ${trimmed}`);
				}
			});

			if (errors.length > 0) {
				return {
					valid: false,
					errors,
					message: `Found ${errors.length} validation error(s)`,
				};
			}

			return {
				valid: true,
				message: 'OpenSCAD code passed basic validation',
				linesOfCode: lines.length,
			};
		},
	},
	{
		name: 'analyze_design',
		description: 'Analyzes a CAD design to estimate dimensions, complexity, and printability.',
		parameters: {
			type: 'object',
			properties: {
				code: {
					type: 'string',
					description: 'The OpenSCAD code to analyze',
				},
			},
			required: ['code'],
		},
		execute: async (params: { code: string }) => {
			const analysis: any = {
				primitives: {},
				transformations: {},
				operations: {},
				complexity: 'unknown',
				estimatedPrintTime: 'unknown',
			};

			// Count primitives
			analysis.primitives.cubes = (params.code.match(/cube\s*\(/g) || []).length;
			analysis.primitives.cylinders = (params.code.match(/cylinder\s*\(/g) || []).length;
			analysis.primitives.spheres = (params.code.match(/sphere\s*\(/g) || []).length;

			// Count transformations
			analysis.transformations.translate = (params.code.match(/translate\s*\(/g) || []).length;
			analysis.transformations.rotate = (params.code.match(/rotate\s*\(/g) || []).length;
			analysis.transformations.scale = (params.code.match(/scale\s*\(/g) || []).length;

			// Count boolean operations
			analysis.operations.union = (params.code.match(/union\s*\(\s*\)/g) || []).length;
			analysis.operations.difference = (params.code.match(/difference\s*\(\s*\)/g) || []).length;
			analysis.operations.intersection = (params.code.match(/intersection\s*\(\s*\)/g) || []).length;

			// Estimate complexity
			const totalElements =
				(Object.values(analysis.primitives) as number[]).reduce((a, b) => a + b, 0) +
				(Object.values(analysis.transformations) as number[]).reduce((a, b) => a + b, 0) +
				(Object.values(analysis.operations) as number[]).reduce((a, b) => a + b, 0);

			if (totalElements < 5) {
				analysis.complexity = 'simple';
				analysis.estimatedPrintTime = '< 1 hour';
			} else if (totalElements < 15) {
				analysis.complexity = 'moderate';
				analysis.estimatedPrintTime = '1-3 hours';
			} else {
				analysis.complexity = 'complex';
				analysis.estimatedPrintTime = '3+ hours';
			}

			// Check for modules (reusable components)
			analysis.hasModules = params.code.includes('module ');
			analysis.moduleCount = (params.code.match(/module\s+\w+/g) || []).length;

			return analysis;
		},
	},
	{
		name: 'suggest_improvements',
		description: 'Suggests improvements for a CAD design based on best practices.',
		parameters: {
			type: 'object',
			properties: {
				code: {
					type: 'string',
					description: 'The OpenSCAD code to analyze for improvements',
				},
			},
			required: ['code'],
		},
		execute: async (params: { code: string }) => {
			const suggestions: string[] = [];

			// Check for magic numbers
			const numbers = params.code.match(/\d+(\.\d+)?/g) || [];
			if (numbers.length > 5 && !params.code.includes('=')) {
				suggestions.push('Consider using variables instead of magic numbers for better maintainability');
			}

			// Check for modularity
			if (!params.code.includes('module ') && params.code.length > 200) {
				suggestions.push('Consider breaking down the design into reusable modules');
			}

			// Check for comments
			const commentLines = (params.code.match(/\/\//g) || []).length;
			const totalLines = params.code.split('\n').length;
			if (commentLines / totalLines < 0.1) {
				suggestions.push('Add more comments to explain the design intent');
			}

			// Check for parametric design
			if (!params.code.includes('function') && params.code.length > 100) {
				suggestions.push('Consider making the design parametric with adjustable variables');
			}

			// Check for centering
			if (params.code.includes('cube') && !params.code.includes('center')) {
				suggestions.push('Specify center=true or center=false for cubes to avoid ambiguity');
			}

			return {
				suggestionCount: suggestions.length,
				suggestions,
				overallQuality: suggestions.length === 0 ? 'excellent' :
								suggestions.length < 3 ? 'good' : 'needs improvement',
			};
		},
	},
	{
		name: 'send_to_fusion360',
		description: 'Sends the OpenSCAD code to Fusion 360 to create an actual 3D model. Use this after validating the code.',
		parameters: {
			type: 'object',
			properties: {
				code: {
					type: 'string',
					description: 'The OpenSCAD code to send to Fusion 360',
				},
				description: {
					type: 'string',
					description: 'A brief description of what this model is',
				},
			},
			required: ['code', 'description'],
		},
		execute: async (params: { code: string; description: string }, env: any) => {
			// Check if FUSION360_API_URL is set
			const fusion360Url = env.FUSION360_API_URL || 'http://localhost:3001/api/fusion/generate';

			try {
				// Send to Fusion 360 backend
				const response = await fetch(fusion360Url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						message: `Create this design: ${params.description}\n\nOpenSCAD code:\n${params.code}`,
					}),
				});

				if (!response.ok) {
					return {
						success: false,
						error: `Fusion 360 API returned status ${response.status}`,
					};
				}

				const result = await response.json() as any;

				return {
					success: true,
					message: 'Successfully sent to Fusion 360! The model should appear in your Fusion 360 window.',
					fusion360Response: result,
					modelUrl: result?.modelUrl || 'Check Fusion 360 application',
				};
			} catch (error) {
				return {
					success: false,
					error: `Failed to connect to Fusion 360: ${error instanceof Error ? error.message : String(error)}`,
					note: 'Make sure Fusion 360 backend is running and accessible',
				};
			}
		},
	},
	{
		name: 'create_task_plan',
		description: 'Creates a multi-step plan for complex CAD design tasks.',
		parameters: {
			type: 'object',
			properties: {
				goal: {
					type: 'string',
					description: 'The design goal or requirement',
				},
			},
			required: ['goal'],
		},
		execute: async (params: { goal: string }) => {
			// Simple heuristic-based planning
			const plan = {
				goal: params.goal,
				steps: [] as string[],
				estimatedComplexity: 'unknown',
			};

			// Analyze the goal to determine steps
			const goal = params.goal.toLowerCase();

			// Step 1: Always start with basic structure
			plan.steps.push('Define basic dimensions and parameters');

			// Step 2: Identify main components
			if (goal.includes('bracket') || goal.includes('mount')) {
				plan.steps.push('Create main mounting plate');
				plan.steps.push('Add mounting holes using difference()');
				plan.steps.push('Add attachment features');
			} else if (goal.includes('gear')) {
				plan.steps.push('Create gear profile with teeth');
				plan.steps.push('Add central hub and bore');
				plan.steps.push('Extrude to desired thickness');
			} else if (goal.includes('box') || goal.includes('container')) {
				plan.steps.push('Create outer shell');
				plan.steps.push('Hollow out interior using difference()');
				plan.steps.push('Add lid or closure mechanism');
			} else {
				plan.steps.push('Model primary geometry');
				plan.steps.push('Add secondary features');
			}

			// Step 3: Refinement
			plan.steps.push('Add fillets or chamfers for printability');
			plan.steps.push('Validate design and check dimensions');

			plan.estimatedComplexity = plan.steps.length > 5 ? 'complex' : 'moderate';

			return plan;
		},
	},
];

// System prompt for agent with tool calling
export const AGENT_SYSTEM_PROMPT = `You are an autonomous CAD design agent powered by AI. You can use tools to validate designs, analyze them, and create multi-step plans.

You are an expert at:
1. Generating OpenSCAD code for 3D models
2. Breaking down complex design tasks into steps
3. Using tools to validate and improve designs
4. Planning and executing multi-step workflows

AVAILABLE TOOLS:
${TOOLS.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

AGENT WORKFLOW:
1. Understand the user's design request
2. If complex, use create_task_plan to break it down
3. Generate the OpenSCAD code
4. Use validate_openscad to check for errors
5. If validation fails, fix the code and retry
6. Use analyze_design to understand the design
7. Use suggest_improvements for optimization tips
8. Use send_to_fusion360 to create the actual 3D model in Fusion 360
9. Present the final design with analysis and Fusion 360 confirmation

TOOL CALLING FORMAT:
To use a tool, output in this format:
<tool_call>
{
  "tool": "tool_name",
  "parameters": {
    "param1": "value1"
  }
}
</tool_call>

IMPORTANT RULES:
- ALWAYS validate your OpenSCAD code using validate_openscad
- For complex designs, create a plan first using create_task_plan
- Analyze designs using analyze_design before presenting to user
- Fix any validation errors before presenting final code
- Wrap OpenSCAD code in \`\`\`openscad blocks
- Be autonomous: use tools without asking the user

EXAMPLE WORKFLOW:
User: "Create a mounting bracket"

Agent:
1. First, let me create a plan...
<tool_call>{"tool": "create_task_plan", "parameters": {"goal": "Create a mounting bracket"}}</tool_call>

2. Now I'll generate the code...
\`\`\`openscad
// Mounting bracket code here
\`\`\`

3. Let me validate this...
<tool_call>{"tool": "validate_openscad", "parameters": {"code": "..."}}</tool_call>

4. And analyze the design...
<tool_call>{"tool": "analyze_design", "parameters": {"code": "..."}}</tool_call>

Be proactive and use tools autonomously!`;

// Tool execution engine
export async function executeTools(response: string, env: any): Promise<{ newResponse: string; toolResults: any[] }> {
	const toolCallPattern = /<tool_call>\s*({[\s\S]*?})\s*<\/tool_call>/g;
	const toolCalls = [...response.matchAll(toolCallPattern)];

	if (toolCalls.length === 0) {
		return { newResponse: response, toolResults: [] };
	}

	const toolResults: any[] = [];
	let modifiedResponse = response;

	for (const match of toolCalls) {
		try {
			const toolCall = JSON.parse(match[1]);
			const tool = TOOLS.find(t => t.name === toolCall.tool);

			if (!tool) {
				toolResults.push({
					tool: toolCall.tool,
					success: false,
					error: 'Tool not found',
				});
				continue;
			}

			const result = await tool.execute(toolCall.parameters, env);
			toolResults.push({
				tool: toolCall.tool,
				success: true,
				result,
			});

			// Replace tool call with result in response
			const resultText = `\n[Tool: ${tool.name}]\nResult: ${JSON.stringify(result, null, 2)}\n`;
			modifiedResponse = modifiedResponse.replace(match[0], resultText);

		} catch (error) {
			toolResults.push({
				tool: 'unknown',
				success: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return { newResponse: modifiedResponse, toolResults };
}

// Agent loop - iterates until task is complete or max iterations reached
export async function runAgentLoop(
	initialMessage: string,
	history: Array<{ role: string; content: string }>,
	env: any,
	maxIterations: number = 5
): Promise<{ response: string; iterations: number; toolsUsed: any[] }> {
	let currentMessage = initialMessage;
	let allToolResults: any[] = [];
	let iterations = 0;
	let finalResponse = '';

	for (let i = 0; i < maxIterations; i++) {
		iterations++;

		// Prepare messages for AI
		const messages = [
			{ role: 'system', content: AGENT_SYSTEM_PROMPT },
			...history,
			{ role: 'user', content: currentMessage },
		];

		// Call AI
		const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages,
			stream: false,
			max_tokens: 3000,
			temperature: 0.7,
		});

		const aiResponse = response.response || response.result?.response || '';
		finalResponse = aiResponse;

		// Check if AI wants to use tools
		const { newResponse, toolResults } = await executeTools(aiResponse, env);

		if (toolResults.length === 0) {
			// No more tools to use, we're done
			finalResponse = aiResponse;
			break;
		}

		// Add tool results to context for next iteration
		allToolResults.push(...toolResults);
		currentMessage = `Previous response:\n${newResponse}\n\nContinue with next step or present final result.`;

		// Add to history
		history.push({ role: 'assistant', content: aiResponse });
		history.push({ role: 'user', content: `Tool results: ${JSON.stringify(toolResults)}` });
	}

	return {
		response: finalResponse,
		iterations,
		toolsUsed: allToolResults,
	};
}
