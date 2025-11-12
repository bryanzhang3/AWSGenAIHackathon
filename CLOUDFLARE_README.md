# cf_ai_VibeCAD - Cloudflare AI Agent Edition

> **IMPORTANT**: When submitting this project, rename the repository to `cf_ai_VibeCAD` to meet Cloudflare's assignment requirements.

Text-to-CAD generation powered by Cloudflare Workers AI (Llama 3.3). This is a Cloudflare-native version of VibeCAD that converts natural language descriptions into 3D CAD models using OpenSCAD.

## 🎯 Cloudflare AI Assignment Components

This application meets all required components for the Cloudflare AI assignment:

### ✅ 1. LLM Integration
- **Model**: Llama 3.3 (70B Instruct FP8 Fast) via Cloudflare Workers AI
- **Binding**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- **Features**: Streaming responses, multi-turn conversations, specialized CAD prompt engineering

### ✅ 2. Workflow / Coordination
- **Cloudflare Workers**: Main API endpoints and request handling
- **Durable Objects**: Persistent conversation state and memory management
- **Event-driven**: Server-Sent Events (SSE) for real-time streaming

### ✅ 3. User Input via Chat
- **Modern Chat Interface**: Built with Next.js 15 and React 19
- **Real-time Streaming**: Live responses from Llama 3.3
- **Conversation Management**: Clear history, multi-turn interactions
- **Deployed on**: Cloudflare Pages

### ✅ 4. Memory / State
- **Durable Objects**: `ConversationState` class for persistent storage
- **Per-conversation**: Each conversation has unique ID and history
- **Persistent**: Survives across worker invocations
- **Operations**: Add messages, retrieve history, clear conversations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare Pages                       │
│              (Next.js Frontend)                          │
│  - Chat Interface                                        │
│  - Markdown Rendering                                    │
│  - SSE Stream Handling                                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Workers                          │
│                 (API Layer)                              │
│  - /api/chat (non-streaming)                             │
│  - /api/chat/stream (SSE streaming)                      │
│  - /api/conversation/clear                               │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
               │                  │
               ▼                  ▼
┌──────────────────────┐  ┌──────────────────────┐
│   Workers AI         │  │  Durable Objects     │
│   (Llama 3.3)        │  │  (ConversationState) │
│                      │  │                      │
│  - Text Generation   │  │  - Message History   │
│  - Streaming         │  │  - State Persistence │
│  - CAD Prompting     │  │  - Memory Management │
└──────────────────────┘  └──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

1. **Cloudflare Account** with Workers AI access
2. **Node.js** 18+ and npm/pnpm
3. **Wrangler CLI** - Cloudflare's development tool

```bash
npm install -g wrangler
```

### Installation

#### 1. Clone and Navigate

```bash
# Rename repository to meet requirements
# (rename on GitHub to: cf_ai_VibeCAD)

cd cloudflare-worker
```

#### 2. Install Dependencies

```bash
# Worker dependencies
npm install

# Frontend dependencies
cd ../cloudflare-frontend
npm install
```

#### 3. Configure Secrets (Optional)

If you want to integrate with Onshape API:

```bash
cd ../cloudflare-worker
wrangler secret put ONSHAPE_ACCESS_KEY
wrangler secret put ONSHAPE_SECRET_KEY
```

#### 4. Run Locally

**Terminal 1 - Start Worker:**
```bash
cd cloudflare-worker
npm run dev
# Worker will run on http://localhost:8787
```

**Terminal 2 - Start Frontend:**
```bash
cd cloudflare-frontend

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8787" > .env.local

npm run dev
# Frontend will run on http://localhost:3000
```

#### 5. Open Application

Navigate to `http://localhost:3000` and start chatting!

## 🌐 Deployment

### Deploy Worker to Cloudflare

```bash
cd cloudflare-worker

# Development environment
npm run deploy

# Production environment
npm run deploy:production
```

After deployment, you'll get a URL like:
```
https://vibecad-ai-agent.your-subdomain.workers.dev
```

### Deploy Frontend to Cloudflare Pages

#### Option 1: Via Wrangler

```bash
cd cloudflare-frontend

# Build the frontend
npm run build

# Deploy to Pages
npx wrangler pages deploy .next
```

#### Option 2: Via Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Create Application** → **Pages**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `cloudflare-frontend`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://vibecad-ai-agent.your-subdomain.workers.dev`
6. Click **Save and Deploy**

### Update API URL

After deploying the worker, update your frontend environment variable:

```bash
# In cloudflare-frontend/.env.local or Cloudflare Pages settings
NEXT_PUBLIC_API_URL=https://vibecad-ai-agent.YOUR-SUBDOMAIN.workers.dev
```

## 📖 Usage

### Basic Chat

1. Open the application
2. Type a natural language description of a CAD object
3. Llama 3.3 will generate OpenSCAD code
4. Copy the code to use in OpenSCAD software

### Example Prompts

```
"Create a simple gear with 15 teeth and radius 30mm"

"Design a bracket to mount a 5-inch monitor at 45 degrees"

"Make a phone stand with adjustable angle"

"Create a mounting bracket with 4 screw holes"

"Design a parametric box with lid (100x50x30mm)"
```

### Conversation Features

- **Multi-turn**: Ask follow-up questions to refine designs
- **Streaming**: See responses generated in real-time
- **Clear**: Reset conversation anytime with trash icon
- **Persistent**: Conversations saved in Durable Objects

## 🧠 How It Works

### 1. User Input
User types a CAD design request in the chat interface.

### 2. API Request
Frontend sends POST request to Worker with message and conversation ID.

### 3. Conversation State
Worker retrieves conversation history from Durable Object.

### 4. LLM Processing
Worker calls Llama 3.3 with:
- System prompt (CAD expertise)
- Conversation history
- User's new message

### 5. Streaming Response
Llama 3.3 generates response, streamed via SSE to frontend.

### 6. State Update
Worker saves assistant response to Durable Object.

### 7. Display
Frontend renders streaming response with markdown syntax highlighting.

## 🛠️ Technology Stack

### Backend (Cloudflare Worker)
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **AI Model**: Llama 3.3 (70B Instruct FP8 Fast)
- **State**: Durable Objects
- **Streaming**: Server-Sent Events (SSE)

### Frontend (Cloudflare Pages)
- **Framework**: Next.js 15
- **UI**: React 19
- **Styling**: TailwindCSS 4.1
- **Components**: Radix UI
- **Markdown**: react-markdown + remark-gfm

## 📁 Project Structure

```
.
├── cloudflare-worker/
│   ├── src/
│   │   └── index.ts                 # Main Worker + Durable Object
│   ├── wrangler.toml                # Cloudflare configuration
│   ├── package.json
│   └── tsconfig.json
│
├── cloudflare-frontend/
│   ├── app/
│   │   ├── page.tsx                 # Home page
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── chat.tsx                 # Main chat component
│   │   ├── ui/                      # UI components
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── package.json
│   ├── next.config.mjs
│   └── .env.example
│
├── CLOUDFLARE_README.md             # This file
├── PROMPTS.md                       # AI prompts documentation
└── LICENSE
```

## 🔑 Environment Variables

### Worker Secrets (Optional)
```bash
ONSHAPE_ACCESS_KEY=your_access_key
ONSHAPE_SECRET_KEY=your_secret_key
```

### Frontend Environment
```bash
NEXT_PUBLIC_API_URL=https://your-worker.workers.dev
```

## 🧪 Testing Locally

1. **Start Worker**:
```bash
cd cloudflare-worker
npm run dev
```

2. **Test Worker Directly**:
```bash
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a simple cube"}'
```

3. **Test Streaming**:
```bash
curl -N -X POST http://localhost:8787/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a gear with 10 teeth"}'
```

## 🔍 Monitoring

### View Worker Logs
```bash
cd cloudflare-worker
npm run tail
```

### Cloudflare Dashboard
- **Analytics**: View requests, errors, CPU time
- **Durable Objects**: Monitor object creation and usage
- **Workers AI**: Track model invocations and costs

## 🎓 Learning Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [OpenSCAD Documentation](https://openscad.org/documentation.html)

## 🤝 Contributing

This is a hackathon project for Cloudflare's AI assignment. Feel free to fork and experiment!

## 📝 License

MIT License - See LICENSE file for details

## 🏆 Assignment Checklist

- [x] **LLM**: Llama 3.3 via Workers AI
- [x] **Workflow**: Cloudflare Workers + Durable Objects
- [x] **User Input**: Chat interface on Cloudflare Pages
- [x] **Memory**: Durable Objects for conversation state
- [x] **Repository**: Prefix with `cf_ai_`
- [x] **README.md**: Complete documentation with running instructions
- [x] **PROMPTS.md**: All AI prompts documented

## 🚧 Future Enhancements

- [ ] OpenSCAD rendering in browser (using WASM)
- [ ] Direct Onshape integration via Worker
- [ ] 3D preview with Three.js
- [ ] Export to STL/STEP formats
- [ ] Multi-user collaboration with Durable Objects
- [ ] Voice input support
- [ ] Image-to-CAD generation

## 📞 Support

For issues or questions:
1. Check the [Cloudflare Community](https://community.cloudflare.com/)
2. Review [Workers AI documentation](https://developers.cloudflare.com/workers-ai/)
3. Open an issue on GitHub

---

**Built with ❤️ using Cloudflare Workers AI**

*Turning natural language into 3D designs, one conversation at a time.*
