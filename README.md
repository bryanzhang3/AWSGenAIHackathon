# 🚀 Cursor for CAD - Fusion 360 AI Copilot

**AI copilot embedded directly inside Fusion 360. Type what you want, AI builds it.**

---

## What Is This?

A chat panel that lives **INSIDE Fusion 360** (like Cursor's sidebar in VS Code).

Type: `"Create a mounting bracket"`
→ 3D model appears in your viewport ✨

**You work in ONE app: Fusion 360. Everything happens there.**

---

## Quick Start (30 Minutes)

### Prerequisites

1. **Fusion 360** - https://www.autodesk.com/products/fusion-360/free-trial
2. **Node.js 18+** - `node --version`
3. **Anthropic API Key** - https://console.anthropic.com/settings/keys

### Setup

**Step 1: Backend (5 min)**
```bash
cd backend

# Install
npm install express cors dotenv @anthropic-ai/sdk

# Add API key
echo "ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE" > .env

# Start (leave running)
node backend-fusion.js
```

✅ **Test:** Open http://localhost:3001/health

**Step 2: Install Add-in (2 min)**

**Mac:**
```bash
cp -r fusion-addin/FusionCADCopilot ~/Library/Application\ Support/Autodesk/Autodesk\ Fusion\ 360/API/AddIns/
```

**Windows:**
```cmd
xcopy fusion-addin\FusionCADCopilot "%APPDATA%\Autodesk\Autodesk Fusion 360\API\AddIns\FusionCADCopilot\" /E /I
```

**Step 3: Run in Fusion (1 min)**

1. Open Fusion 360
2. **Tools > Add-Ins > Scripts and Add-Ins**
3. Click **FusionCADCopilot** → **Run**
4. Panel appears on right! 🎉

---

## Test It Works

Type in the chat panel:

**Demo 1:**
```
Create a 50mm cube
```
→ Cube appears ✅

**Demo 2:**
```
Add a 10mm hole through the center
```
→ Hole appears ✅

**Demo 3:**
```
Create a mounting bracket, 80x50x10mm, with 4 M6 holes in corners
```
→ Complete bracket ✅

---

## How It Works

```
┌──────────────────────────────────┐
│  Fusion 360 (only window open)  │
│  ┌─────────────┬──────────────┐ │
│  │ 3D Viewport │ 🤖 Chat      │ │
│  │             │              │ │
│  │ Model       │ Type here    │ │
│  │ appears     │ AI generates │ │
│  │ here        │ Python code  │ │
│  │             │ [Execute]    │ │
│  └─────────────┴──────────────┘ │
└──────────────────────────────────┘
         ↕ API calls
┌──────────────────────────────────┐
│  Backend (terminal, background)  │
│  Claude Sonnet 4 API            │
└──────────────────────────────────┘
```

**You stay in Fusion 360. Backend is invisible.**

---

## Project Structure

```
├── fusion-addin/FusionCADCopilot/
│   ├── FusionCADCopilot.py         # Python add-in
│   ├── resources/palette.html       # Chat UI
│   └── FusionCADCopilot.manifest
│
├── backend/
│   ├── backend-fusion.js            # ⭐ START THIS
│   ├── routes/fusion.js             # API endpoints
│   └── prompts/fusion360_system.txt # AI prompt
│
└── docs/                            # Reference docs
    ├── YC_STRATEGY_CURSOR_FOR_CAD.md
    ├── IMPLEMENTATION_PLAN.md
    └── CAD_INTEGRATION_RESEARCH.md
```

---

## Troubleshooting

**Backend won't start:**
```bash
# Check API key
cat backend/.env

# Check port 3001 is free
lsof -i :3001
```

**Panel doesn't appear:**
```bash
# Verify install (Mac)
ls ~/Library/Application\ Support/Autodesk/Autodesk\ Fusion\ 360/API/AddIns/FusionCADCopilot/
```

**"Cannot connect":**
- Backend running? `curl http://localhost:3001/health`
- Check `.env` has `ANTHROPIC_API_KEY`

**Code doesn't execute:**
- Check Fusion Text Commands for errors
- Try: "Create a 50mm cube"
- Must be in Design mode

---

## Tech Stack

- **Platform:** Fusion 360 (10M+ users, 28.8% pro market share)
- **Add-in:** Python + HTML/JS
- **Backend:** Node.js + Express
- **AI:** Claude Sonnet 4

---

## Features

- ✅ Natural language → 3D models
- ✅ Real-time generation
- ✅ Multi-turn conversations ("make it bigger")
- ✅ Code editing
- ✅ Quick templates
- ✅ Embedded in Fusion 360

---

## Documentation

- **README.md** (this file) - Quick setup
- **docs/YC_STRATEGY_CURSOR_FOR_CAD.md** - Full YC strategy
- **docs/IMPLEMENTATION_PLAN.md** - Technical details

---

**Ready? Start backend, load add-in, type "Create a 50mm cube"! ✨**

---

*Built for YC W2026 - "Cursor for CAD"*
