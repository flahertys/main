# 🎯 IntelliJ IDEA Setup Guide for TradeHax

## 🔗 Connect to Your `.iml` Environment

Your IntelliJ IDEA project has been configured for Next.js/Node.js development. Here's how to use it:

---

## ✅ What's Configured

### Files Updated
```
C:\tradez\main\.idea\
├── main.iml                  (Updated - Web Module)
├── misc.xml                  (Updated - Project Settings)
├── modules.xml               (Existing - Module Manager)
├── vcs.xml                   (Existing - Git Integration)
├── node_config.xml           (NEW - Node/NPM Config)
├── runConfigurations.xml     (NEW - Run Configurations)
└── editor_config.xml         (NEW - Editor Settings)
```

### Configured Features
- ✅ TypeScript & ES2022 support
- ✅ Next.js framework recognition
- ✅ Node.js SDK integration
- ✅ NPM package management
- ✅ 8 pre-configured run configurations
- ✅ Code style (2-space indent, no quotes)
- ✅ Git integration
- ✅ Web framework support

---

## 🚀 Getting Started

### Step 1: Open Project in IntelliJ IDEA

```bash
# Option A: Open from IntelliJ
File → Open → C:\tradez\main

# Option B: Open from command line
idea C:\tradez\main
```

### Step 2: Trust the Project

IntelliJ will ask to trust the project. Click **"Trust Project"**.

### Step 3: Configure Node.js (if needed)

If IntelliJ shows warnings about Node.js:

1. **File** → **Project Structure**
2. **Project** section → Select SDK
3. If Node.js not detected:
   - Click **Add SDK**
   - Select **Node.js**
   - Browse to your Node.js installation
   - Click **OK**

### Step 4: Verify NPM

1. **File** → **Project Structure**
2. **JavaScript** → **Node.js and NPM**
3. Verify NPM is detected (should show version)

---

## ▶️ Run Configurations

IntelliJ now has 8 pre-configured run commands. Access them:

**From IDE:**
- Top toolbar: Click dropdown next to green play button
- Select configuration and click play

**Available Configurations:**

| Config | Command | Purpose |
|--------|---------|---------|
| **Dev Server** | npm run dev | Start local development (port 3000) |
| **Build** | npm run build | Production build |
| **Lint** | npm run lint | Code quality check |
| **Type Check** | npm run type-check | TypeScript validation |
| **Start Production** | npm run start | Start production server |
| **Deploy to Namecheap** | npm run build | Prepare for deployment |
| **Test HF Inference** | npm run hf:test-inference | Test LLM API |
| **Format Code** | npm run format | Auto-format code |

### Run a Configuration

```
1. Click the run dropdown (top right)
2. Select "Dev Server" (or any config)
3. Click the green play button
4. Output appears in "Run" panel below
```

---

## 🎨 Code Editor Setup

### Automatic Code Style
Your project uses:
- ✅ 2-space indentation
- ✅ Single quotes for strings
- ✅ Semicolons required
- ✅ Spaces in object literals

Formatting will apply automatically when you:
- Paste code
- Press `Ctrl+Alt+L` (reformat)
- Save file (if auto-format enabled)

### Enable Auto-Format on Save

1. **File** → **Settings** (or **IntelliJ IDEA** → **Preferences** on Mac)
2. **Tools** → **Actions on Save**
3. Check: **Reformat code**
4. Check: **Optimize imports**
5. Click **Apply** → **OK**

---

## 🔍 IDE Features

### Intelligent Code Completion

Start typing and IntelliJ will suggest:
- React components
- TypeScript types
- Next.js utilities
- Imported libraries

**Trigger:** Start typing or press `Ctrl+Space`

### Go to Definition

Jump to where something is defined:
- **Ctrl+Click** on any function/component
- Or **Ctrl+B** with cursor on the symbol

### Find Usages

See everywhere a function/component is used:
- Right-click → **Find Usages**
- Or **Ctrl+Alt+Shift+F7** with cursor on symbol

### Search Everywhere

Find files, classes, functions instantly:
- Press **Ctrl+Shift+A** (search everywhere)
- Type what you're looking for
- Select result

### Refactoring

Rename safely across entire codebase:
- Right-click on variable/function
- **Refactor** → **Rename**
- Type new name
- Preview and apply

---

## 🔗 Version Control (Git)

IntelliJ integrates with Git automatically.

### Commit Changes

1. **Ctrl+K** or **VCS** → **Commit**
2. Select files to commit
3. Write commit message
4. Click **Commit** or **Commit and Push**

### Push to GitHub

1. **VCS** → **Git** → **Push**
2. Or press **Ctrl+Shift+K**

### Pull from GitHub

1. **VCS** → **Git** → **Pull**
2. Or press **Ctrl+T**

### View History

1. Right-click file → **Git** → **Show History**
2. Or click the **Git** tab at bottom

---

## 📦 Package Management

### Install Dependencies

Use the NPM tool window:

1. **View** → **Tool Windows** → **NPM**
2. Double-click `npm install` in the list
3. Or run configuration: **Install** (if exists)

### Install New Package

In NPM window, right-click → **Run npm script**

Or in terminal:
```bash
npm install package-name --save
```

---

## 🐛 Debugging

### Debug in IntelliJ

1. Set breakpoint by clicking line number
2. Run with debug: Click debug icon (bug icon next to play)
3. Execution pauses at breakpoint
4. Inspect variables in **Debugger** panel

### Debug Console

1. Click **Debug** tab at bottom
2. Console shows output and allows evaluation

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut | Purpose |
|--------|----------|---------|
| **Run** | Shift+F10 | Run current configuration |
| **Debug** | Shift+F9 | Debug current configuration |
| **Format Code** | Ctrl+Alt+L | Reformat selected code |
| **Go to Definition** | Ctrl+B | Jump to definition |
| **Find Usages** | Ctrl+Alt+F7 | Find where symbol is used |
| **Rename** | Shift+F6 | Rename symbol |
| **Search Everywhere** | Ctrl+Shift+A | Search files, symbols, etc. |
| **Commit** | Ctrl+K | Commit changes |
| **Push** | Ctrl+Shift+K | Push to Git |
| **Pull** | Ctrl+T | Pull from Git |
| **Terminal** | Alt+F12 | Open terminal |

---

## 📂 File Structure in IDE

IntelliJ recognizes:
```
app/                  → React pages & API routes
components/           → React components
lib/                  → Utility functions & libraries
hooks/                → Custom React hooks
types/                → TypeScript type definitions
ai/                   → AI-related code
scripts/              → Build/deployment scripts
public/               → Static assets
node_modules/         → Dependencies (grayed out - excluded)
.next/                → Build output (grayed out - excluded)
```

---

## 🔍 Code Inspections

IntelliJ checks code quality in real-time. You'll see:
- 🔴 Red squiggles = Errors
- 🟡 Yellow squiggles = Warnings
- 💡 Light bulb = Quick fixes available

Click the lightbulb to see suggestions.

---

## 🚨 Troubleshooting

### Node.js Not Detected

1. **File** → **Project Structure** → **Project**
2. Check "SDK" dropdown
3. If showing "No SDK", click **Add SDK** → **Node.js**
4. Browse to Node installation directory
5. Click **OK**

### NPM Not Showing in NPM Tool Window

1. **File** → **Project Structure** → **JavaScript** → **Node.js and NPM**
2. Check "Node interpreter" is set
3. Click **OK**
4. Reload project: **File** → **Invalidate Caches** → **Invalidate and Restart**

### Slow IntelliJ Performance

1. **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Memory**
2. Increase heap size (try 2048 MB)
3. Restart IntelliJ

### TypeScript Errors

1. **File** → **Project Structure** → **Project**
2. Verify Language level is **ES2022**
3. Verify TypeScript is installed: `npm list typescript`

---

## 🎯 Workflow Example

### Typical Development Session

```bash
# 1. Open project
idea C:\tradez\main

# 2. Run dev server (from IntelliJ)
# Select "Dev Server" from run dropdown → Click play

# 3. Edit files (with real-time error checking)
# Modify app/page.tsx or components/

# 4. Auto-format on save (already configured)
# Just save - formatting happens automatically

# 5. Check code quality
# Select "Lint" from run dropdown → Click play

# 6. Commit changes
# Ctrl+K → Select files → Write message → Commit

# 7. Push to GitHub
# Ctrl+Shift+K → Select branch → Push

# 8. Build for production (when ready)
# Select "Build" from run dropdown → Click play
```

---

## ✨ Next Steps

1. ✅ Open project in IntelliJ IDEA
2. ✅ Trust the project when prompted
3. ✅ Verify Node.js is configured
4. ✅ Run "Dev Server" configuration
5. ✅ Visit http://localhost:3000
6. ✅ Start editing files

---

## 📞 Quick Help

**IntelliJ Help:**
- Press **F1** for context help
- **Help** → **Documentation** for full docs
- **Help** → **Find Action** → Type your question

**Your TradeHax Project:**
- All APIs documented in `TRADEHAX_SYSTEM_OVERVIEW.md`
- Deployment in `QUICK_DEPLOY_GUIDE.md`
- Quick reference in `QUICK_REFERENCE.md`

---

## ✅ IDE is Ready!

Your IntelliJ IDEA environment is now configured with:
- ✅ TypeScript & ES2022 support
- ✅ Next.js recognition
- ✅ Node.js SDK
- ✅ 8 run configurations
- ✅ Git integration
- ✅ Code style setup
- ✅ Auto-formatting

**Status: 🚀 Ready to develop!**

---

**Setup Date:** Current  
**IDE:** IntelliJ IDEA 2024+  
**Project:** C:\tradez\main  
**Status:** ✅ Fully configured
