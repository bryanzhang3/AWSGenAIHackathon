# Fusion 360 AI Copilot - Implementation Plan
## 2-3 Day POC Build Plan

**Target:** Working demo by November 9, 2025
**Platform:** Fusion 360 (Python Add-in)
**Goal:** "Cursor for CAD" proof-of-concept for YC application

---

## Overview

### What We're Building

A Fusion 360 add-in that provides a chat interface where users type natural language descriptions and AI generates 3D CAD models in real-time.

**Core Workflow:**
1. User types: "Create a 50mm mounting bracket with 4 M5 holes"
2. AI generates Python code using Fusion 360 API
3. Code executes automatically → model appears in viewport
4. User refines: "Make the holes bigger" → model updates

**Demo Scenarios for YC Video:**
1. Simple object: "Create a 50mm cube" → cube appears
2. Refinement: "Add a 10mm hole through center" → hole added
3. Complex part: "Create a mounting bracket, 80x50x10mm, with 4 M6 bolt holes in corners"

---

## Architecture

### Component Stack

```
┌─────────────────────────────────────────────────────────┐
│  Fusion 360 Add-in (Python)                             │
│  ├── FusionCADCopilot.py (main add-in file)             │
│  ├── FusionCADCopilot.manifest (metadata)               │
│  ├── resources/                                         │
│  │   └── palette.html (chat UI)                         │
│  └── lib/                                               │
│      ├── api_client.py (calls backend API)              │
│      ├── code_executor.py (runs generated code)         │
│      └── fusion_utils.py (helper functions)             │
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS (fetch API)
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Backend API (Reuse existing AWS hackathon code)        │
│  ├── server.js or server.py (FastAPI migration)         │
│  ├── routes/                                            │
│  │   └── chat.js → AI generation endpoint               │
│  ├── prompts/                                           │
│  │   └── fusion360_system_prompt.txt                    │
│  └── utils/                                             │
│      └── claude_client.js (or Anthropic API directly)   │
└─────────────────────────────────────────────────────────┘
```

---

## Day-by-Day Plan

### Day 1: Setup & Basic Integration (8 hours)

**Morning (4 hours): Environment Setup & Learning**

**[1 hour] Install & Configure Fusion 360**
- [ ] Download Fusion 360 (free trial): https://www.autodesk.com/products/fusion-360/free-trial
- [ ] Install on Mac/Windows
- [ ] Create Autodesk account
- [ ] Open Fusion 360, verify it works
- [ ] Navigate to Tools > Add-ins > Scripts and Add-ins

**[1 hour] Study FusionGPT Code**
- [ ] Clone: `git clone https://github.com/JulianStremel/FusionGPT.git`
- [ ] Read their code:
  - How Palette is created (`ui.palettes.add(...)`)
  - HTML/JS ↔ Python communication (`palette.sendInfoToHTML()`, `incomingFromHTML` event)
  - How they call OpenAI API
- [ ] Test their add-in (if you want to see it working)
- [ ] Understand file structure

**[1 hour] Study Official Palette Sample**
- [ ] Read: https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/PaletteSample_Sample.htm
- [ ] Review: https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/Palettes_UM.htm
- [ ] Understand:
  - `palettes.add(id, name, htmlFile, isVisible, showCloseButton, isResizable, width, height)`
  - `palette.dockingState = adsk.core.PaletteDockingStates.PaletteDockStateRight`
  - Event handling for HTML ↔ Python communication

**[1 hour] Create Basic Add-in Skeleton**
- [ ] In Fusion 360: Tools > Add-ins > Scripts and Add-ins > Create > Add-in
- [ ] Name it: `FusionCADCopilot`
- [ ] Language: Python
- [ ] Location: Save to your project folder (e.g., `/backend/fusion-addin/`)
- [ ] Files created:
  ```
  FusionCADCopilot/
  ├── FusionCADCopilot.py
  ├── FusionCADCopilot.manifest
  └── (we'll add more)
  ```

**Afternoon (4 hours): Build Basic Palette**

**[2 hours] Create Palette with HTML UI**

Create `FusionCADCopilot.py`:
```python
import adsk.core, adsk.fusion, traceback

_app = adsk.core.Application.get()
_ui = _app.userInterface
_handlers = []
_palette = None

def run(context):
    try:
        global _palette

        # Create palette
        _palette = _ui.palettes.add(
            'FusionCADCopilot',
            'CAD Copilot',
            './resources/palette.html',
            True,  # isVisible
            True,  # showCloseButton
            True,  # isResizable
            300,   # width
            600    # height
        )

        # Dock to right side
        _palette.dockingState = adsk.core.PaletteDockingStates.PaletteDockStateRight

        # Register event handlers
        onHTMLEvent = PaletteHTMLEventHandler()
        _palette.incomingFromHTML.add(onHTMLEvent)
        _handlers.append(onHTMLEvent)

        _ui.messageBox('CAD Copilot loaded! Check right panel.')

    except:
        if _ui:
            _ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

def stop(context):
    try:
        if _palette:
            _palette.deleteMe()
        _ui.messageBox('CAD Copilot stopped.')
    except:
        if _ui:
            _ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

class PaletteHTMLEventHandler(adsk.core.HTMLEventHandler):
    def __init__(self):
        super().__init__()

    def notify(self, args):
        try:
            message = args.data
            _ui.messageBox(f'Received from HTML: {message}')

            # TODO: Handle AI generation here

        except:
            _ui.messageBox('Error:\n{}'.format(traceback.format_exc()))
```

Create `resources/palette.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CAD Copilot</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 10px;
            background: #1e1e1e;
            color: #d4d4d4;
        }
        #chat {
            height: 500px;
            overflow-y: auto;
            border: 1px solid #3c3c3c;
            padding: 10px;
            margin-bottom: 10px;
            background: #252526;
        }
        .message {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
        }
        .user {
            background: #094771;
            text-align: right;
        }
        .ai {
            background: #1a472a;
        }
        #input {
            width: calc(100% - 70px);
            padding: 8px;
            border: 1px solid #3c3c3c;
            background: #3c3c3c;
            color: #d4d4d4;
        }
        #send {
            padding: 8px 15px;
            background: #0e639c;
            border: none;
            color: white;
            cursor: pointer;
        }
        #send:hover {
            background: #1177bb;
        }
    </style>
</head>
<body>
    <h2>🤖 CAD Copilot</h2>
    <div id="chat"></div>
    <input type="text" id="input" placeholder="Describe what you want to build..." />
    <button id="send">Send</button>

    <script>
        const chat = document.getElementById('chat');
        const input = document.getElementById('input');
        const send = document.getElementById('send');

        send.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            addMessage('user', text);
            input.value = '';

            // Send to Python
            window.adsk.fusionSendData('generate', text);
        }

        function addMessage(type, text) {
            const msg = document.createElement('div');
            msg.className = `message ${type}`;
            msg.textContent = text;
            chat.appendChild(msg);
            chat.scrollTop = chat.scrollHeight;
        }

        // Receive from Python
        window.fusionJavaScriptHandler = {
            handle: function(action, data) {
                if (action === 'response') {
                    addMessage('ai', data);
                }
            }
        };
    </script>
</body>
</html>
```

**Tasks:**
- [ ] Create files above
- [ ] Load add-in in Fusion 360
- [ ] Click "Run"
- [ ] Verify palette appears on right side
- [ ] Test typing message → should show alert box (basic communication working)

**[2 hours] Integrate Backend API**

Update existing Express backend or create FastAPI version:

`backend/routes/fusion.js`:
```javascript
const express = require('express');
const router = express.Router();
const { callClaude } = require('../utils/claude_client');

router.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        const systemPrompt = `You are an expert at generating Fusion 360 Python code.

IMPORTANT RULES:
1. Generate ONLY executable Python code
2. Use Fusion 360 API (adsk.core, adsk.fusion)
3. No markdown, no explanations, just code
4. Always start with: app = adsk.core.Application.get()
5. Use design.rootComponent for operations

EXAMPLE:
User: "Create a 50mm cube"
You generate:
app = adsk.core.Application.get()
design = app.activeProduct
rootComp = design.rootComponent
sketches = rootComp.sketches
xyPlane = rootComp.xYConstructionPlane
sketch = sketches.add(xyPlane)
sketch.sketchCurves.sketchLines.addCenterPointRectangle(
    adsk.core.Point3D.create(0, 0, 0),
    adsk.core.Point3D.create(2.5, 2.5, 0)
)
extrudes = rootComp.features.extrudeFeatures
prof = sketch.profiles.item(0)
extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
distance = adsk.core.ValueInput.createByReal(5.0)
extInput.setDistanceExtent(False, distance)
extrudes.add(extInput)

Now generate code for: ${prompt}`;

        const code = await callClaude(systemPrompt, prompt);

        res.json({ code });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

Update Python add-in to call API:
```python
import urllib.request
import json

class PaletteHTMLEventHandler(adsk.core.HTMLEventHandler):
    def notify(self, args):
        try:
            data = json.loads(args.data)
            action = data.get('action')
            message = data.get('message')

            if action == 'generate':
                # Call backend API
                req = urllib.request.Request(
                    'http://localhost:3001/api/fusion/generate',
                    data=json.dumps({'prompt': message}).encode(),
                    headers={'Content-Type': 'application/json'}
                )
                response = urllib.request.urlopen(req)
                result = json.loads(response.read())
                code = result['code']

                # Send code back to HTML
                _palette.sendInfoToHTML('response', code)

                # Execute code
                exec(code)

        except Exception as e:
            _palette.sendInfoToHTML('error', str(e))
```

**Tasks:**
- [ ] Add `/api/fusion/generate` route to backend
- [ ] Test backend endpoint with curl/Postman
- [ ] Update Python add-in to call API
- [ ] Test end-to-end: type message → backend generates code → returns to add-in

---

### Day 2: Code Generation & Execution (8 hours)

**Morning (4 hours): Prompt Engineering**

**[2 hours] Create Fusion 360 System Prompt**

Create `backend/prompts/fusion360_system.txt`:
```
You are an expert Fusion 360 API code generator. You generate precise, executable Python code using the Fusion 360 API.

CRITICAL RULES:
1. Output ONLY Python code - no markdown, no explanations
2. Code must be directly executable in Fusion 360 Python environment
3. Always use standard Fusion 360 API patterns
4. Handle units: Fusion uses cm internally (5.0 = 50mm)
5. Create new bodies unless modifying existing

STANDARD SETUP (include at start):
```python
app = adsk.core.Application.get()
ui = app.userInterface
design = adsk.fusion.Design.cast(app.activeProduct)
rootComp = design.rootComponent
```

COMMON OPERATIONS:

CREATE CUBE (50mm):
```python
sketches = rootComp.sketches
xyPlane = rootComp.xYConstructionPlane
sketch = sketches.add(xyPlane)
lines = sketch.sketchCurves.sketchLines
rect = lines.addTwoPointRectangle(
    adsk.core.Point3D.create(0, 0, 0),
    adsk.core.Point3D.create(5, 5, 0)
)
prof = sketch.profiles.item(0)
extrudes = rootComp.features.extrudeFeatures
extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
distance = adsk.core.ValueInput.createByReal(5)
extInput.setDistanceExtent(False, distance)
extrude = extrudes.add(extInput)
```

CREATE CYLINDER (diameter 30mm, height 50mm):
```python
sketches = rootComp.sketches
xyPlane = rootComp.xYConstructionPlane
sketch = sketches.add(xyPlane)
circles = sketch.sketchCurves.sketchCircles
circle = circles.addByCenterRadius(
    adsk.core.Point3D.create(0, 0, 0),
    1.5
)
prof = sketch.profiles.item(0)
extrudes = rootComp.features.extrudeFeatures
extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
distance = adsk.core.ValueInput.createByReal(5)
extInput.setDistanceExtent(False, distance)
extrude = extrudes.add(extInput)
```

ADD HOLE (10mm diameter, through a face):
```python
# Get top face of existing body
body = rootComp.bRepBodies.item(0)
face = body.faces.item(0)  # Assuming top face
sketch = sketches.add(face)
circles = sketch.sketchCurves.sketchCircles
circle = circles.addByCenterRadius(
    adsk.core.Point3D.create(0, 0, 0),
    0.5
)
prof = sketch.profiles.item(0)
holes = rootComp.features.extrudeFeatures
holeInput = holes.createInput(prof, adsk.fusion.FeatureOperations.CutFeatureOperation)
holeInput.setAllExtent(adsk.fusion.ExtentDirections.PositiveExtentDirection)
hole = holes.add(holeInput)
```

MOUNTING BRACKET (80x50x10mm with 4 M6 holes):
```python
# Base plate
sketches = rootComp.sketches
xyPlane = rootComp.xYConstructionPlane
sketch = sketches.add(xyPlane)
lines = sketch.sketchCurves.sketchLines
rect = lines.addTwoPointRectangle(
    adsk.core.Point3D.create(-4, -2.5, 0),
    adsk.core.Point3D.create(4, 2.5, 0)
)
prof = sketch.profiles.item(0)
extrudes = rootComp.features.extrudeFeatures
extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
distance = adsk.core.ValueInput.createByReal(1)
extInput.setDistanceExtent(False, distance)
extrude = extrudes.add(extInput)

# Holes
body = rootComp.bRepBodies.item(0)
topFace = body.faces.item(0)
sketch2 = sketches.add(topFace)
circles = sketch2.sketchCurves.sketchCircles

# 4 holes in corners (M6 = 6mm diameter = 0.6cm)
positions = [(-3, -1.5, 0), (3, -1.5, 0), (-3, 1.5, 0), (3, 1.5, 0)]
for pos in positions:
    circles.addByCenterRadius(adsk.core.Point3D.create(*pos), 0.3)

for i in range(4):
    prof = sketch2.profiles.item(i)
    holeInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.CutFeatureOperation)
    holeInput.setAllExtent(adsk.fusion.ExtentDirections.PositiveExtentDirection)
    extrudes.add(holeInput)
```

Now generate code for the user's request. Remember: ONLY Python code, no markdown.
```

**Tasks:**
- [ ] Create system prompt file
- [ ] Add 5-10 more examples (gear, shaft, enclosure, etc.)
- [ ] Test with Claude API directly (Postman/curl)
- [ ] Verify generated code is valid Python

**[2 hours] Test Code Generation**

Create test script `backend/test_generation.js`:
```javascript
const { callClaude } = require('./utils/claude_client');
const fs = require('fs');

const systemPrompt = fs.readFileSync('./prompts/fusion360_system.txt', 'utf8');

const testCases = [
    "Create a 50mm cube",
    "Create a cylinder, 30mm diameter, 50mm height",
    "Create a mounting bracket, 80x50x10mm, with 4 M6 holes in corners"
];

async function test() {
    for (const testCase of testCases) {
        console.log(`\nTest: ${testCase}`);
        const code = await callClaude(systemPrompt, testCase);
        console.log('Generated code:');
        console.log(code);
        console.log('---');
    }
}

test();
```

**Tasks:**
- [ ] Run test script
- [ ] Verify code looks correct
- [ ] Copy code into Fusion 360 Python console manually
- [ ] Verify it creates the object
- [ ] Iterate on prompts until quality is good

**Afternoon (4 hours): Code Execution & UI**

**[2 hours] Safe Code Execution**

Update Python add-in with better execution:
```python
class CodeExecutor:
    def __init__(self, ui):
        self.ui = ui

    def execute(self, code):
        """Safely execute generated code"""
        try:
            # Create isolated namespace
            namespace = {
                'adsk': adsk,
                '__builtins__': __builtins__
            }

            # Execute code
            exec(code, namespace)

            return True, "Code executed successfully"

        except Exception as e:
            return False, f"Execution error: {str(e)}\n{traceback.format_exc()}"

# In PaletteHTMLEventHandler:
executor = CodeExecutor(_ui)

def notify(self, args):
    # ... (previous code)

    # Execute code
    success, message = executor.execute(code)

    if success:
        _palette.sendInfoToHTML('success', message)
    else:
        _palette.sendInfoToHTML('error', message)
```

**Tasks:**
- [ ] Implement safe execution
- [ ] Add error handling
- [ ] Test with invalid code
- [ ] Add timeout (if needed)

**[2 hours] Improve UI**

Update `palette.html`:
```html
<!-- Add code display area -->
<div id="code-container" style="display:none;">
    <h3>Generated Code</h3>
    <pre id="code-display"></pre>
    <button id="execute">Execute</button>
    <button id="copy">Copy Code</button>
</div>

<script>
function showCode(code) {
    document.getElementById('code-display').textContent = code;
    document.getElementById('code-container').style.display = 'block';
}

document.getElementById('execute').addEventListener('click', () => {
    const code = document.getElementById('code-display').textContent;
    window.adsk.fusionSendData('execute', code);
});

document.getElementById('copy').addEventListener('click', () => {
    const code = document.getElementById('code-display').textContent;
    navigator.clipboard.writeText(code);
    alert('Code copied!');
});

// Update handler
window.fusionJavaScriptHandler = {
    handle: function(action, data) {
        if (action === 'code') {
            showCode(data);
        } else if (action === 'success') {
            addMessage('ai', '✅ ' + data);
        } else if (action === 'error') {
            addMessage('ai', '❌ ' + data);
        }
    }
};
</script>
```

**Tasks:**
- [ ] Add code display area
- [ ] Add execute/copy buttons
- [ ] Add loading spinner during generation
- [ ] Add error messages with styling

---

### Day 3: Polish & Demo Video (8 hours)

**Morning (4 hours): Multi-turn Conversations**

**[2 hours] Implement Context Awareness**

Update backend to maintain conversation history:
```javascript
const conversations = new Map();

router.post('/generate', async (req, res) => {
    const { prompt, conversationId } = req.body;

    // Get or create conversation
    if (!conversations.has(conversationId)) {
        conversations.set(conversationId, []);
    }
    const history = conversations.get(conversationId);

    // Add context to prompt
    const contextPrompt = history.length > 0
        ? `Previous context:\n${history.join('\n\n')}\n\nNow: ${prompt}`
        : prompt;

    const code = await callClaude(systemPrompt, contextPrompt);

    // Save to history
    history.push(`User: ${prompt}\nGenerated: ${code}`);

    res.json({ code, conversationId });
});
```

Update Python add-in:
```python
self.conversation_id = str(uuid.uuid4())

def notify(self, args):
    # Include conversation ID in API call
    req_data = {
        'prompt': message,
        'conversationId': self.conversation_id
    }
```

**Tasks:**
- [ ] Add conversation history
- [ ] Test refinements: "Make it bigger", "Add holes", etc.
- [ ] Ensure context is maintained

**[2 hours] Add Common Templates**

Create quick actions in UI:
```html
<div id="templates">
    <h3>Quick Templates</h3>
    <button onclick="generate('Create a 50mm cube')">Cube</button>
    <button onclick="generate('Create a cylinder, 30mm diameter, 50mm height')">Cylinder</button>
    <button onclick="generate('Create a mounting bracket, 80x50x10mm, with 4 M6 holes')">Bracket</button>
</div>

<script>
function generate(prompt) {
    input.value = prompt;
    sendMessage();
}
</script>
```

**Tasks:**
- [ ] Add template buttons
- [ ] Test they work
- [ ] Add 3-5 common parts

**Afternoon (4 hours): Demo Video**

**[1 hour] Prepare Demo Script**

Script for 1-minute YC video:
```
[0:00-0:10] Hook
- Screen recording: Fusion 360 with our palette
- Voiceover: "CAD engineering is hard to learn and repetitive. What if you could just describe what you want?"

[0:10-0:25] Demo 1: Simple
- Type: "Create a 50mm cube"
- AI generates code (show code briefly)
- Click Execute
- Cube appears in Fusion
- Voiceover: "We built Cursor for CAD. Type what you want, AI builds it."

[0:25-0:40] Demo 2: Refinement
- Type: "Add a 10mm hole through the center"
- Model updates instantly
- Voiceover: "Refine designs with natural language. Multi-turn conversations let you iterate instantly."

[0:40-0:50] Demo 3: Complex
- Type: "Create a mounting bracket, 80x50x10mm, with 4 M6 holes in corners"
- Show bracket being created
- Voiceover: "Complex parts in seconds. Fusion 360 has 10 million users. We're bringing AI to CAD."

[0:50-1:00] Team & CTA
- Quick team photo
- Text overlay: "Cursor for CAD - [Your Names]"
- Voiceover: "We're [names]. Making CAD as easy as talking. Apply to YC."
```

**Tasks:**
- [ ] Write detailed script
- [ ] Practice demo flow
- [ ] Ensure all scenarios work reliably

**[2 hours] Record Video**

Tools needed:
- Screen recording: OBS Studio (free) or QuickTime (Mac)
- Video editing: iMovie (Mac), DaVinci Resolve (free), or Camtasia
- Voiceover: Phone or laptop mic

Recording checklist:
- [ ] Clean up Fusion 360 interface (close unnecessary panels)
- [ ] Large font size for code visibility
- [ ] Clean desktop (close other apps)
- [ ] Practice 3-5 times before recording
- [ ] Record 3-5 takes, pick best one
- [ ] Record voiceover separately (easier to edit)
- [ ] Add text overlays: stats, team info, call-to-action

**[1 hour] Edit & Export**

- [ ] Cut to exactly 1:00 (YC prefers shorter)
- [ ] Add text overlays for key stats:
  - "28.8% market share - Fusion 360"
  - "10M+ users"
  - "$12B CAD market"
- [ ] Add music (optional, keep low)
- [ ] Export as MP4, 1080p
- [ ] Upload to YouTube (unlisted)
- [ ] Test plays smoothly

---

## Pivoting Existing Codebase

### What to Reuse

**✅ Keep (90% compatible):**
- Backend Express server structure
- Claude API integration (`utils/claude_client.js`)
- Environment variables (`.env`)
- Streaming support (can be added later)
- Conversation management logic
- Error handling patterns

**❌ Replace:**
- Frontend (Next.js) → Fusion 360 Palette (HTML/JS)
- OpenSCAD generation → Fusion 360 Python code
- STL generation → Direct Fusion API calls
- Onshape MCP → Not needed (native Fusion)
- MCP server → Not needed for POC

### Migration Steps

**1. Create new folder structure:**
```
AWSGenAIHackathon/
├── backend/                    # Keep existing
│   ├── server.js               # ✅ Keep
│   ├── routes/
│   │   ├── chat.js             # ❌ Modify
│   │   └── fusion.js           # ✅ New
│   ├── prompts/
│   │   └── fusion360_system.txt  # ✅ New
│   └── utils/
│       └── claude_client.js    # ✅ Keep
└── fusion-addin/               # ✅ New
    ├── FusionCADCopilot.py
    ├── FusionCADCopilot.manifest
    └── resources/
        └── palette.html
```

**2. Update backend routes:**
```bash
# Rename/copy
cp backend/routes/chat.js backend/routes/fusion.js

# Update fusion.js:
# - Change prompts to Fusion 360 specific
# - Remove OpenSCAD logic
# - Return Python code instead
```

**3. Create add-in:**
```bash
# Will be created in Fusion 360 UI
# Then copy to fusion-addin/ for version control
```

---

## Testing Checklist

### Before Recording Demo

**Core Functionality:**
- [ ] Palette loads and displays correctly
- [ ] Chat interface is responsive
- [ ] Typing sends message to backend
- [ ] Backend returns generated code
- [ ] Code displays in UI
- [ ] Execute button runs code
- [ ] Model appears in Fusion viewport

**Test Cases:**
1. [ ] "Create a 50mm cube" → cube appears
2. [ ] "Create a cylinder, 30mm diameter, 50mm height" → cylinder appears
3. [ ] "Create a mounting bracket, 80x50x10mm, with 4 M6 holes" → bracket appears
4. [ ] "Add a 10mm hole through the center" → hole added to existing object
5. [ ] "Make it twice as big" → object scales

**Error Handling:**
- [ ] Invalid prompt → shows error message
- [ ] Backend down → shows friendly error
- [ ] Code fails to execute → shows error with details
- [ ] Network timeout → retries or shows error

**UI/UX:**
- [ ] Loading spinner during generation
- [ ] Success/error messages clear
- [ ] Code is readable (syntax highlighting would be nice)
- [ ] Conversation history scrolls properly

---

## API Endpoints

### Backend API

**POST /api/fusion/generate**
```json
Request:
{
  "prompt": "Create a 50mm cube",
  "conversationId": "uuid" // optional
}

Response:
{
  "code": "app = adsk.core.Application.get()...",
  "conversationId": "uuid"
}

Error:
{
  "error": "Error message"
}
```

**GET /api/health**
```json
Response:
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

## Environment Setup

### Required Software

1. **Fusion 360**
   - Download: https://www.autodesk.com/products/fusion-360/free-trial
   - Free trial: 30 days
   - Or student license (free)

2. **VS Code** (for debugging)
   - Extensions:
     - Python (ms-python.python)
     - Optional: Autodesk Fusion 360 extension

3. **Backend**
   - Node.js 18+ OR Python 3.8+
   - Dependencies:
     ```bash
     npm install express cors dotenv @anthropic-ai/sdk
     ```

### Environment Variables

`.env`:
```
# AI Provider (pick one)
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...

# Server
PORT=3001
NODE_ENV=development

# Optional
ALLOWED_ORIGINS=http://localhost:3000
```

---

## Deployment (Post-POC)

### For YC Demo: Local Only

No deployment needed for YC application. Run locally:
- Backend: `npm start` (port 3001)
- Fusion add-in: Load from Fusion 360 UI

### Future: Production Deployment

**Backend:**
- Heroku, Railway, or Render (free tier)
- Or AWS (since you have experience)

**Add-in Distribution:**
- GitHub releases
- Autodesk App Store (later)
- Direct download from website

---

## Success Criteria

### Minimum Viable Demo for YC

- [x] ✅ Palette loads in Fusion 360
- [x] ✅ Can create simple objects (cube, cylinder)
- [x] ✅ Can refine existing objects
- [x] ✅ Code is visible and editable
- [x] ✅ Errors are handled gracefully
- [x] ✅ 1-minute video showcases core workflow

### Stretch Goals (if time permits)

- [ ] Syntax highlighting for code
- [ ] Undo/redo functionality
- [ ] Save conversation history
- [ ] Export generated code to file
- [ ] Multiple AI provider support

---

## Troubleshooting

### Common Issues

**Palette doesn't appear:**
- Check add-in loaded: Tools > Add-ins > Scripts and Add-ins
- Check for Python errors in Fusion console
- Verify HTML file path is correct

**Code doesn't execute:**
- Check Python syntax
- Verify Fusion API calls are correct
- Look for exceptions in Fusion UI

**Backend connection fails:**
- Ensure backend is running (port 3001)
- Check CORS settings
- Verify URL in Python code matches

**AI generates invalid code:**
- Improve system prompt with more examples
- Add validation layer before execution
- Show errors to user clearly

---

## Timeline Summary

| Day | Hours | Focus | Deliverable |
|-----|-------|-------|-------------|
| **Day 1** | 8 | Setup & Basic Integration | Working palette with backend connection |
| **Day 2** | 8 | Code Generation & Execution | Can generate and execute simple objects |
| **Day 3** | 8 | Polish & Demo | 1-minute YC video ready |

**Total:** 24 hours over 3 days (Nov 7-9)
**Deadline:** Submit YC app by Nov 10

---

## Next Steps After YC Submission

1. **Wait for YC response** (Dec-Jan)
2. **Iterate based on user feedback** (beta testers)
3. **Add more features:**
   - Assemblies
   - Constraints
   - Simulations
4. **Improve AI quality:**
   - Fine-tuning
   - More examples
   - Better error recovery
5. **Plan go-to-market:**
   - HN launch
   - ProductHunt
   - Autodesk App Store

---

**Let's build this! 🚀**

**Document Version:** 1.0
**Last Updated:** November 7, 2025
