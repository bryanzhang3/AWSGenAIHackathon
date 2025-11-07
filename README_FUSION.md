# 🚀 Cursor for CAD - Fusion 360 AI Copilot

**AI-powered CAD generation inside Fusion 360. Like Cursor, but for CAD.**

https://github.com/user-attachments/assets/example-video-here

## What Is This?

An AI copilot that lives inside Fusion 360 - just like Cursor lives inside VS Code. Engineers describe what they want to build in natural language, and AI generates the 3D model instantly.

**Example:**
```
You: "Create a mounting bracket, 80x50x10mm, with 4 M6 holes in corners"
AI: [Generates Python code] → [Bracket appears in Fusion 360]
```

## Quick Start (Mac)

**Get a working demo in 2 hours:**

```bash
# 1. Install Fusion 360 (15 min)
open https://www.autodesk.com/products/fusion-360/free-trial

# 2. Install backend dependencies (2 min)
cd backend
npm install express cors dotenv @anthropic-ai/sdk

# 3. Add API key (1 min)
echo "ANTHROPIC_API_KEY=sk-ant-YOUR_KEY" > .env

# 4. Start backend (1 min)
node backend-fusion.js

# 5. Load add-in in Fusion 360 (10 min)
# Copy add-in to Fusion:
cp -r fusion-addin/FusionCADCopilot ~/Library/Application\ Support/Autodesk/Autodesk\ Fusion\ 360/API/AddIns/

# In Fusion 360: Tools > Add-Ins > Run "FusionCADCopilot"

# 6. Test it! (5 min)
# Type in the panel: "Create a 50mm cube"
# Watch the magic happen! ✨
```

**Full setup guide:** [QUICK_START.md](QUICK_START.md)

## Features

- ✅ **Natural language to CAD** - Describe what you want, AI builds it
- ✅ **Real-time generation** - See models appear as you type
- ✅ **Multi-turn conversations** - Refine designs: "make it bigger", "add holes"
- ✅ **Code editing** - View and edit generated Python code
- ✅ **Quick templates** - One-click cube, cylinder, bracket, etc.
- ✅ **Error handling** - Clear error messages, retry on failure

## Demo Scenarios

### 1. Simple Object
```
Create a 50mm cube
```
→ Cube appears instantly

### 2. Refinement
```
Add a 10mm hole through the center
```
→ Hole added to existing object

### 3. Complex Engineering Part
```
Create a mounting bracket, 80x50x10mm, with 4 M6 holes in corners
```
→ Complete bracket with clearance holes

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **CAD Platform** | Fusion 360 (10M+ users, 28.8% market share) |
| **Add-in** | Python with HTML/JS palette |
| **Backend** | Express.js (Node.js) |
| **AI Model** | Claude Sonnet 4 (Anthropic API) |
| **CAD API** | Fusion 360 Python API (adsk.core, adsk.fusion) |

## Project Structure

```
├── fusion-addin/              # Fusion 360 add-in
│   └── FusionCADCopilot/
│       ├── FusionCADCopilot.py       # Main add-in file
│       ├── FusionCADCopilot.manifest # Metadata
│       └── resources/
│           └── palette.html          # Chat UI
│
├── backend/                   # Backend API
│   ├── backend-fusion.js             # Express server
│   ├── routes/
│   │   └── fusion.js                 # API routes
│   ├── prompts/
│   │   └── fusion360_system.txt      # Claude system prompt
│   └── package-fusion.json           # Dependencies
│
├── QUICK_START.md             # 2-hour setup guide
├── IMPLEMENTATION_PLAN.md     # 3-day build plan
└── YC_STRATEGY_CURSOR_FOR_CAD.md  # Full YC strategy
```

## Market Opportunity

- **CAD Market:** $12.2B (2024) → $19.8B (2030)
- **Fusion 360 Users:** 10M+ (5M+ education, growing)
- **Market Share:** 28.8% professional CAD users (#1 position)
- **Target Users:** 28M CAD engineers globally

**Precedent:**
- GitHub Copilot: Billions in revenue
- Cursor: $100M ARR in 2 years
- Onlook: YC-backed "Cursor for Designers"

## Why Fusion 360?

| Criteria | Fusion 360 | SolidWorks | AutoCAD |
|----------|-----------|------------|---------|
| **Market Share** | 28.8% (#1) | 26.5% (#2) | ~15% |
| **Growth** | ✅ Growing | ✅ Growing | ❌ Declining |
| **Integration** | Easy (Python) | Hard (COM/C#) | Medium |
| **Platform** | Mac + Windows | Windows only | Windows only |
| **Users** | 10M+ | 6M+ | 10M+ |

## Roadmap

### Phase 1: MVP (NOW - Nov 10)
- [x] ✅ Working Fusion 360 add-in
- [x] ✅ Backend API with Claude integration
- [x] ✅ 3 demo scenarios
- [ ] Record YC demo video
- [ ] Submit YC application

### Phase 2: Beta (Dec-Jan)
- [ ] 100 beta testers
- [ ] Product-market fit validation
- [ ] Testimonials from engineers
- [ ] Launch on Hacker News

### Phase 3: Launch (Feb-Mar)
- [ ] Autodesk App Store listing
- [ ] ProductHunt launch
- [ ] 1,000 users
- [ ] Freemium model

### Phase 4: Growth (Apr-Jun)
- [ ] Enterprise customers
- [ ] Custom fine-tuning
- [ ] $10K MRR

## Pricing (Planned)

| Tier | Price | Target |
|------|-------|--------|
| **Free** | $0/mo | Students, hobbyists (100 generations/mo) |
| **Pro** | $29/mo | Individual engineers (unlimited) |
| **Team** | $99/user/mo | Small teams (shared templates) |
| **Enterprise** | Custom | Large companies (fine-tuning, on-premise) |

## YC Application

**Deadline:** November 10, 2025

**Status:** ✅ Implementation complete, ready for demo video

**Resources:**
- [YC Application Strategy](YC_STRATEGY_CURSOR_FOR_CAD.md) - Complete application text
- [Quick Start Guide](QUICK_START.md) - Get demo working in 2 hours
- [Implementation Plan](IMPLEMENTATION_PLAN.md) - Technical details

## Contributing

This is currently a YC application project. After submission, we plan to open source the add-in (like Cursor initially did).

## License

MIT (for add-in code)

Backend API usage subject to terms after launch.

## Team

[Your team info here - fill in for YC application]

## Contact

- GitHub: [Your GitHub]
- Email: [Your email]
- Twitter: [Your Twitter]

---

**Built with ❤️ for engineers who want to design faster**

"Cursor transformed coding. We're doing the same for CAD engineering."
