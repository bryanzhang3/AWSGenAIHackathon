# Repository Setup Instructions

## ⚠️ IMPORTANT: Repository Naming Requirement

To meet Cloudflare's assignment requirements, this repository **MUST** be renamed with the `cf_ai_` prefix.

### Required Repository Name

```
cf_ai_VibeCAD
```

or any variation like:

```
cf_ai_vibecad
cf_ai_text_to_cad
cf_ai_openscad_generator
```

The key requirement is the **`cf_ai_`** prefix.

---

## How to Rename Your Repository

### On GitHub

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click **Settings** (gear icon in the top menu)

2. **Rename Repository**
   - Scroll down to the **Repository name** section
   - Change the name to: `cf_ai_VibeCAD` (or your preferred name with `cf_ai_` prefix)
   - Click **Rename**

3. **Update Local Repository**
   ```bash
   # Navigate to your local repository
   cd AWSGenAIHackathon

   # Update remote URL (replace YOUR_USERNAME)
   git remote set-url origin https://github.com/YOUR_USERNAME/cf_ai_VibeCAD.git

   # Verify the change
   git remote -v
   ```

---

## Final Checklist Before Submission

### ✅ Required Files

- [x] **README.md** → Use `CLOUDFLARE_README.md` as main README
- [x] **PROMPTS.md** → AI prompts documentation (completed)
- [x] **cloudflare-worker/** → Worker implementation with Llama 3.3
- [x] **cloudflare-frontend/** → Next.js frontend for Cloudflare Pages
- [x] **wrangler.toml** → Cloudflare configuration
- [x] **LICENSE** → Project license

### ✅ Documentation Requirements

- [x] Clear running instructions (local + deployed)
- [x] All AI prompts documented in PROMPTS.md
- [x] Architecture diagrams and explanations
- [x] Environment setup instructions
- [x] Deployment guides for Worker and Pages

### ✅ Cloudflare AI Components

- [x] **LLM**: Llama 3.3 via Workers AI
- [x] **Workflow**: Cloudflare Workers
- [x] **Coordination**: Durable Objects for state
- [x] **User Input**: Chat interface
- [x] **Memory**: Conversation history in Durable Objects

---

## Recommended Repository Structure

After renaming, your final repository should look like:

```
cf_ai_VibeCAD/
│
├── README.md                        # Main documentation (use CLOUDFLARE_README.md)
├── PROMPTS.md                       # AI prompts (required)
├── LICENSE                          # Project license
│
├── cloudflare-worker/               # Cloudflare Worker backend
│   ├── src/
│   │   └── index.ts                 # Worker + Durable Object
│   ├── wrangler.toml                # Cloudflare config
│   ├── package.json
│   └── tsconfig.json
│
├── cloudflare-frontend/             # Frontend for Cloudflare Pages
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   ├── next.config.mjs
│   └── .env.example
│
└── [Optional: Keep original AWS version for reference]
    ├── backend/
    └── frontend/
```

---

## Quick Setup Commands

### 1. Rename Repository on GitHub
- Follow the GitHub instructions above

### 2. Replace Main README

```bash
# Backup original README
mv README.md README_ORIGINAL.md

# Use Cloudflare README as main
cp CLOUDFLARE_README.md README.md

# Commit the change
git add .
git commit -m "Update README for Cloudflare AI assignment"
git push origin main
```

### 3. Verify All Required Files

```bash
# Check for required files
ls -la | grep -E "README.md|PROMPTS.md|LICENSE"

# Check cloudflare directories
ls -d cloudflare-*/

# Verify wrangler.toml exists
ls cloudflare-worker/wrangler.toml
```

### 4. Test Locally Before Submission

```bash
# Test Worker
cd cloudflare-worker
npm install
npm run dev

# Test Frontend (in new terminal)
cd ../cloudflare-frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8787" > .env.local
npm run dev
```

### 5. Deploy and Get URLs

```bash
# Deploy Worker
cd cloudflare-worker
npm run deploy

# Note the Worker URL, then deploy frontend
cd ../cloudflare-frontend
# Update NEXT_PUBLIC_API_URL in Cloudflare Pages settings
# Deploy via dashboard or wrangler pages
```

---

## Optional: Clean Up Original AWS Files

If you want a cleaner repository focused only on Cloudflare:

```bash
# Create a separate branch for AWS version
git checkout -b aws-version-backup
git push origin aws-version-backup

# Return to main and remove AWS files
git checkout main
rm -rf backend/
rm -rf frontend/ (if you've fully migrated to cloudflare-frontend)

# Commit cleanup
git add .
git commit -m "Clean up AWS-specific files, focus on Cloudflare"
git push origin main
```

---

## Submission Information

### What to Include in Your Application

1. **Repository URL**: `https://github.com/YOUR_USERNAME/cf_ai_VibeCAD`

2. **Deployed Links**:
   - Worker API: `https://vibecad-ai-agent.your-subdomain.workers.dev`
   - Frontend: `https://vibecad.pages.dev` (or your custom domain)

3. **Key Features**:
   - Text-to-CAD generation using Llama 3.3
   - Real-time streaming chat interface
   - Persistent conversation memory with Durable Objects
   - Fully serverless on Cloudflare infrastructure

4. **Innovation Points**:
   - Specialized prompting for CAD code generation
   - Multi-turn conversation support
   - OpenSCAD code extraction and formatting
   - Educational tool for democratizing CAD design

---

## Verification Checklist

Before submitting, verify:

- [ ] Repository name starts with `cf_ai_`
- [ ] README.md exists with clear instructions
- [ ] PROMPTS.md documents all AI prompts used
- [ ] Local testing works: `npm run dev` in both directories
- [ ] Worker deploys successfully: `npm run deploy`
- [ ] Frontend builds successfully: `npm run build`
- [ ] All environment variables documented
- [ ] License file present
- [ ] Git history shows development progression

---

## Common Issues and Solutions

### Issue 1: Worker deployment fails
**Solution**: Ensure you're logged in with `wrangler login`

### Issue 2: Durable Objects not working
**Solution**: Check migrations in wrangler.toml are correct

### Issue 3: Frontend can't reach Worker
**Solution**: Verify NEXT_PUBLIC_API_URL is set correctly

### Issue 4: Repository rename breaks git
**Solution**: Update remote URL with `git remote set-url origin <new-url>`

---

## Contact and Support

If you encounter issues during setup:

1. Check [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
2. Review [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
3. Join [Cloudflare Discord](https://discord.cloudflare.com)
4. Ask in [Cloudflare Community](https://community.cloudflare.com/)

---

## Timeline Recommendation

1. **Day 1**: Rename repository, verify all files present
2. **Day 1**: Test locally, fix any issues
3. **Day 2**: Deploy Worker and Frontend to Cloudflare
4. **Day 2**: Update README with deployed URLs
5. **Day 2**: Final verification and submission

---

**Good luck with your submission! 🚀**
