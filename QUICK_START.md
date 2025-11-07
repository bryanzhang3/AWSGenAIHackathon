# Quick Start Guide - Fusion CAD Copilot
## Get Your Demo Working in 2 Hours

**Goal:** Working "Cursor for CAD" demo by end of today for YC application.

---

## Prerequisites (15 minutes)

### 1. Install Fusion 360 (Mac)

```bash
# Download from Autodesk
open https://www.autodesk.com/products/fusion-360/free-trial

# Follow installer instructions
# Sign up for free account (student or 30-day trial)
# Launch Fusion 360
```

**Verify:** Fusion 360 opens and you see the main workspace.

### 2. Check Node.js & Dependencies

```bash
# Check Node.js (need 18+)
node --version  # Should be v18.x or higher

# Install backend dependencies
cd backend
npm install express cors dotenv @anthropic-ai/sdk

# Verify
npm list @anthropic-ai/sdk  # Should show version installed
```

### 3. Set Up API Key

Create/update `backend/.env`:
```bash
cd backend
touch .env

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE" >> .env
echo "PORT=3001" >> .env
echo "NODE_ENV=development" >> .env
```

**Get API key:** https://console.anthropic.com/settings/keys

---

## Step 1: Start Backend (5 minutes)

### Update backend/server.js

Add this line after existing routes:
```javascript
// Add Fusion 360 routes
const fusionRoutes = require('./routes/fusion');
app.use('/api/fusion', fusionRoutes);
```

**Full example server.js (if starting fresh):**

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const fusionRoutes = require('./routes/fusion');
app.use('/api/fusion', fusionRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`✅ Fusion 360 API ready at http://localhost:${PORT}/api/fusion`);
});
```

### Start the server

```bash
cd backend
npm start
# OR
node server.js
```

**Verify:** You should see:
```
🚀 Backend running on http://localhost:3001
✅ Loaded Fusion 360 system prompt
```

### Test the API

In another terminal:
```bash
curl http://localhost:3001/api/fusion/health

# Should return:
# {"status":"ok","ready":true,"checks":{...}}
```

---

## Step 2: Load Add-in in Fusion 360 (10 minutes)

### Method 1: Copy Files to Fusion Add-ins Folder (Recommended)

```bash
# Copy the add-in to Fusion's add-in folder
# On Mac:
cp -r fusion-addin/FusionCADCopilot ~/Library/Application\ Support/Autodesk/Autodesk\ Fusion\ 360/API/AddIns/

# Verify it copied
ls ~/Library/Application\ Support/Autodesk/Autodesk\ Fusion\ 360/API/AddIns/FusionCADCopilot
```

### Method 2: Create Directly in Fusion (Alternative)

1. Open Fusion 360
2. Go to **Tools > Add-Ins > Scripts and Add-Ins**
3. Click **Add-Ins** tab
4. Click green **+** (Create) button
5. Choose **Python**
6. Name it: `FusionCADCopilot`
7. Click **Create**

This creates the skeleton. Then:
- Copy contents of `fusion-addin/FusionCADCopilot/FusionCADCopilot.py` into the generated .py file
- Copy `fusion-addin/FusionCADCopilot/FusionCADCopilot.manifest` over the generated .manifest file
- Create `resources/` folder and copy `palette.html` into it

### Load & Run the Add-in

1. In Fusion 360: **Tools > Add-Ins > Scripts and Add-Ins**
2. Find `FusionCADCopilot` in the list
3. Click **Run**
4. A panel should appear on the right side titled **"🤖 CAD Copilot"**

**Troubleshooting:**
- If panel doesn't appear, check for errors in Fusion's text console
- If "file not found" error, verify `resources/palette.html` exists
- If import errors, make sure Python add-in template has correct structure

---

## Step 3: First Test (5 minutes)

### Test 1: Simple Cube

1. In the CAD Copilot panel, type:
   ```
   Create a 50mm cube
   ```
2. Click **Generate**
3. Wait 5-10 seconds
4. You should see:
   - Generated Python code appears
   - "✅ Model generated successfully!" message
   - A cube appears in the Fusion 360 viewport!

**Success!** 🎉 Your AI CAD copilot works!

### Test 2: Cylinder

Clear the viewport (Edit > Delete all), then:
```
Create a cylinder, 30mm diameter, 50mm height
```

### Test 3: Quick Template

Click the **"Bracket"** button under "Quick Start"

This should generate a mounting bracket with holes.

---

## Step 4: Demo Scenarios for YC Video (30 minutes)

Practice these 3 demos:

### Demo 1: Simple Object (10 seconds in video)
```
Create a 50mm cube
```
- Shows basic generation works

### Demo 2: Refinement (15 seconds in video)
With the cube still there:
```
Add a 10mm hole through the center
```
- Shows multi-turn conversations work

### Demo 3: Complex Part (15 seconds in video)
Clear and create:
```
Create a mounting bracket, 80x50x10mm, with 4 M6 holes in corners
```
- Shows it can handle complex engineering requests

**Practice each 3-5 times until reliable!**

---

## Step 5: Record Demo Video (1 hour)

### Setup

1. **Close unnecessary apps** - clean desktop
2. **Set Fusion to fullscreen** - maximize viewport
3. **Position CAD Copilot panel** - docked on right, visible but not too wide
4. **Set text size large** - so code is readable in video
5. **Clear viewport** - start with empty scene

### Recording Tools

**Mac:** Use QuickTime
1. Open QuickTime Player
2. File > New Screen Recording
3. Select area or full screen
4. Click record button

**Alternative:** OBS Studio (free, more features)
- Download: https://obsproject.com/

### Video Script (60 seconds total)

**[0:00-0:10] Hook & Setup**
- Show Fusion 360 with CAD Copilot panel
- Voiceover: "CAD engineering is hard to learn and repetitive tasks waste hours. What if you could just describe what you want?"

**[0:10-0:25] Demo 1 - Simple**
- Type: "Create a 50mm cube"
- Show code generation (2 seconds)
- Click Execute
- Cube appears
- Voiceover: "We built Cursor for CAD. Type what you want, AI generates it in real-time."

**[0:25-0:40] Demo 2 - Refinement**
- Type: "Add a 10mm hole through the center"
- Hole appears
- Voiceover: "Multi-turn conversations let you refine designs instantly. Engineers never leave their workflow."

**[0:40-0:55] Demo 3 - Complex**
- Clear viewport
- Type: "Create a mounting bracket, 80x50x10mm, with 4 M6 holes in corners"
- Bracket appears
- Voiceover: "Complex engineering parts in seconds. Fusion 360 has 10 million users in a $12 billion market."

**[0:55-1:00] Team & CTA**
- Quick fade to team photo or text screen
- Text: "Cursor for CAD - [Your Names]"
- Voiceover: "We're [names], making CAD as easy as talking."

### Recording Tips

- **Do 5-10 takes** - pick the best one where everything works smoothly
- **Record voiceover separately** - easier to edit
- **Keep total under 1 minute** - YC prefers concise
- **Show results, not process** - cut out waiting time
- **No music** - or very subtle background music (optional)

### Editing

**Mac:** Use iMovie (built-in)
1. Import screen recording
2. Cut to exactly 1:00
3. Add voiceover track
4. Add text overlays for stats:
   - "28.8% market share - Fusion 360"
   - "10M+ users"
   - "$12B CAD market"
5. Export as 1080p MP4

**Export settings:**
- Format: MP4
- Quality: High (1080p)
- Size: Keep under 50MB

---

## Step 6: Submit YC Application (30 minutes)

### Fill Out Application

Go to: https://apply.ycombinator.com/

**Open YC_STRATEGY_CURSOR_FOR_CAD.md** - all text is written for you!

Copy-paste these sections:

1. **Company Description** (50 words) - Section 5, Part 1
2. **What You're Building** (120 words) - Section 5, Part 2
3. **Why This** (50 words) - Section 5, Part 3
4. **What's New** (50 words) - Section 5, Part 4
5. **Why Now** (50 words) - Section 5, Part 5
6. **Market Size** (50 words) - Section 5, Part 6
7. **Progress/Traction** (120 words) - Section 5, Part 7
8. **Team** (120 words) - Section 5, Part 8 (YOU FILL IN BIOS)
9. **Video** - Upload your 1-minute video

### Team Section Template

Fill in your actual details:

```
[Founder 1 Name] - [Technical background: degrees, languages you know, years coding].
[Why you care about CAD or decided to build this].

[Founder 2 Name] - [Technical background]. [Your role/focus].

We [how you met/background]. Built this working prototype in 3 days.
Both strong technical backgrounds (Python, C++, JS). Learning CAD APIs fast.
Obsessed with making CAD accessible to everyone.
```

### Video Upload

1. Upload to YouTube (Unlisted)
2. Copy link
3. Paste into YC application

### Review Before Submit

- [ ] All text fields filled
- [ ] Video uploaded and link works
- [ ] Team bios complete
- [ ] Contact info correct
- [ ] Spelling/grammar checked

### Submit!

Click **Submit Application**

**Deadline: November 10**

---

## Troubleshooting

### Backend won't start

```bash
# Check if something is using port 3001
lsof -i :3001

# Kill it if needed
kill -9 <PID>

# Try different port
PORT=3002 node server.js
# Remember to update FusionCADCopilot.py BACKEND_URL
```

### Add-in won't load

```bash
# Check Fusion 360 console for errors
# In Fusion: Tools > Scripts and Add-ins > click on add-in > check output

# Verify files exist
ls -R fusion-addin/FusionCADCopilot/

# Should show:
# FusionCADCopilot.py
# FusionCADCopilot.manifest
# resources/palette.html
```

### Palette doesn't appear

- Click **Run** button in Add-ins dialog
- Check if palette is hidden behind other windows
- Try Window menu in Fusion > check for "CAD Copilot"
- Restart Fusion 360

### "Cannot connect to backend" error

- Verify backend is running: `curl http://localhost:3001/health`
- Check BACKEND_URL in FusionCADCopilot.py matches server port
- Check firewall isn't blocking localhost connections

### Code generates but doesn't execute

- Check Fusion's text console for Python errors
- Verify you're in a design (not just empty document)
- Try simpler prompt first (e.g., "Create a 50mm cube")
- Check if Claude generated valid code (look at code display in panel)

### "Invalid API key" error

- Verify `.env` file exists in `backend/` folder
- Check `ANTHROPIC_API_KEY` is set correctly
- Test API key: `curl https://api.anthropic.com/v1/messages -H "x-api-key: YOUR_KEY" -H "anthropic-version: 2023-06-01"`
- Get new key: https://console.anthropic.com/settings/keys

---

## Next Steps After YC Submission

### If you have time before Nov 10:

1. **Get beta testers**
   - Post in /r/Fusion360 subreddit
   - Share with engineering friends
   - Get testimonials

2. **Open source strategy**
   - Make GitHub repo public
   - Add README with demo GIF
   - Post to Hacker News
   - Tag as "Show HN: Cursor for CAD"

3. **Polish the demo**
   - Add more templates
   - Improve error messages
   - Better UI styling

### After YC response (Dec-Jan):

- Wait for YC interview invite
- If accepted: quit jobs, go full-time
- If not: keep building, apply again or bootstrap

---

## Quick Command Reference

```bash
# Start backend
cd backend && npm start

# Test backend
curl http://localhost:3001/api/fusion/health

# Copy add-in to Fusion (Mac)
cp -r fusion-addin/FusionCADCopilot ~/Library/Application\ Support/Autodesk/Autodesk\ Fusion\ 360/API/AddIns/

# Watch backend logs
cd backend && npm start | tee output.log

# Update code without restarting Fusion
# Just click "Stop" then "Run" in Add-ins dialog
```

---

## Success Checklist

Before recording video, verify:

- [x] Backend starts without errors
- [x] `/api/fusion/health` returns `ready: true`
- [x] Add-in loads in Fusion 360
- [x] Palette appears and is docked
- [x] "Create a 50mm cube" works
- [x] Cube appears in viewport
- [x] Can refine: "Add a 10mm hole"
- [x] Mounting bracket template works
- [x] All 3 demo scenarios tested 3+ times

**When all checked ✅ - you're ready to record!**

---

## Timeline

| Time | Task | Status |
|------|------|--------|
| 0:00-0:15 | Install Fusion 360 & setup | [ ] |
| 0:15-0:20 | Start backend | [ ] |
| 0:20-0:30 | Load add-in in Fusion | [ ] |
| 0:30-0:35 | Test simple cube | [ ] |
| 0:35-1:05 | Practice 3 demos | [ ] |
| 1:05-2:05 | Record & edit video | [ ] |
| 2:05-2:35 | Fill out YC application | [ ] |
| 2:35-2:40 | Submit! | [ ] |

**Total: ~2.5 hours from start to YC submission**

---

**You've got this! Now go build it! 🚀**

Questions? Open an issue or check IMPLEMENTATION_PLAN.md for more details.
