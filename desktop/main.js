const { app, BrowserWindow, Menu, shell, Tray, nativeImage, Notification, ipcMain } = require("electron");
const { spawn, exec } = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const APP_NAME = "RIG Agent OS";
const APP_PORT = 3737;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const APP_DIR = path.join(os.homedir(), "Developer", "rig-os-agency");
const LOG_DIR = path.join(os.homedir(), ".rig-agent-os", "logs");
const DATA_DIR = path.join(os.homedir(), ".rig-agent-os", "data");

let mainWindow = null;
let tray = null;
let serverProcess = null;
let jarvisCheckInterval = null;

function log(...args) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const line = `[${new Date().toISOString()}] ${args.join(" ")}\n`;
  fs.appendFileSync(path.join(LOG_DIR, "desktop.log"), line);
}

function isAppUp() {
  return new Promise((resolve) => {
    const req = http.get(`${APP_URL}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

async function waitForApp(maxRetries = 90, intervalMs = 500) {
  for (let i = 0; i < maxRetries; i += 1) {
    if (await isAppUp()) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

async function startApp() {
  if (await isAppUp()) {
    log("[rig-agent-os] App already running on", APP_URL);
    return APP_URL;
  }

  log("[rig-agent-os] Starting Next.js dev server...");
  // Use dev server — Next.js 16 Turbopack production build doesn't produce next-start-compatible output
  serverProcess = spawn("npx", ["next", "dev", "-p", String(APP_PORT)], {
    cwd: APP_DIR,
    stdio: "pipe",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });

  serverProcess.stdout?.on("data", (data) => {
    const msg = data.toString().trim();
    if (msg) log("[app]", msg);
  });
  serverProcess.stderr?.on("data", (data) => {
    const msg = data.toString().trim();
    if (msg) log("[app:err]", msg);
  });
  serverProcess.on("exit", (code) => {
    log("[app] exited code=" + code);
    serverProcess = null;
  });

  if (!(await waitForApp())) {
    throw new Error(`RIG Agent OS did not become ready at ${APP_URL}`);
  }
  log("[rig-agent-os] App ready at", APP_URL);
  return APP_URL;
}

function navigate(pathname = "") {
  if (!mainWindow) return;
  mainWindow.loadURL(`${APP_URL}${pathname}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1680,
    height: 1050,
    minWidth: 1024,
    minHeight: 700,
    title: APP_NAME,
    backgroundColor: "#0a0a0f",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.loadURL(APP_URL);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.on("closed", () => { mainWindow = null; });
  mainWindow.on("minimize", (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "assets", "tray-iconTemplate.png");
  let trayIcon = nativeImage.createFromPath(iconPath);
  if (trayIcon.isEmpty()) trayIcon = nativeImage.createEmpty();
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Open RIG Agent OS", click: () => { if (mainWindow) { mainWindow.show(); } else createWindow(); } },
    { type: "separator" },
    { label: "🤖 Mission Control", click: () => navigate("/agency") },
    { label: "📦 Offerings", click: () => navigate("/agency/offerings") },
    { label: "☀️ Jarvis Briefing", click: () => navigate("/jarvis") },
    { label: "📊 GTM Pipeline", click: () => navigate("/rig-gtm") },
    { label: "💰 Revenue", click: () => navigate("/agency/stripe") },
    { label: "📋 Contracts", click: () => navigate("/agency/contracts") },
    { label: "📢 Social Media", click: () => navigate("/agency/social") },
    { type: "separator" },
    { label: "🧠 Agents", click: () => navigate("/agency/agents") },
    { label: "📊 System Health", click: () => navigate("/agency/health") },
    { label: "📔 Obsidian", click: () => navigate("/obsidian") },
    { label: "⚡ Capabilities", click: () => navigate("/agency/capabilities") },
    { type: "separator" },
    { label: "🎙️ VoiceBox", click: () => navigate("/voicebox") },
    { label: "🔍 Scraping", click: () => navigate("/agency/scraping") },
    { label: "📝 Teasers", click: () => navigate("/agency/teasers") },
    { type: "separator" },
    { label: "Quit RIG Agent OS", click: () => app.quit() },
  ]);
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => { if (mainWindow) { mainWindow.show(); } else createWindow(); });
}

function createMenu() {
  const template = [
    { label: APP_NAME, submenu: [
      { label: `About ${APP_NAME}`, role: "about" },
      { type: "separator" },
      { label: "Preferences...", accelerator: "CmdOrCtrl+,", click: () => navigate("/settings") },
      { type: "separator" },
      { label: "Hide", role: "hide" }, { label: "Hide Others", role: "hideOthers" }, { label: "Show All", role: "unhide" },
      { type: "separator" },
      { label: "Quit", accelerator: "CmdOrCtrl+Q", click: () => app.quit() },
    ]},
    { label: "Edit", submenu: [
      { role: "undo" }, { role: "redo" }, { type: "separator" },
      { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" },
      { type: "separator" },
      { label: "Speech", submenu: [
        { role: "startSpeaking" }, { role: "stopSpeaking" },
      ]},
    ]},
    { label: "View", submenu: [
      { role: "reload" }, { role: "forceReload" }, { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ]},
    { label: "Agency", submenu: [
      { label: "Mission Control", click: () => navigate("/agency") },
      { label: "Offerings & Engagement", click: () => navigate("/agency/offerings") },
      { label: "Jarvis Briefing", click: () => navigate("/jarvis") },
      { label: "System Health", click: () => navigate("/agency/health") },
      { label: "GTM Pipeline", click: () => navigate("/rig-gtm") },
      { type: "separator" },
      { label: "Clients", click: () => navigate("/agency/clients") },
      { label: "Proposals", click: () => navigate("/agency/proposals") },
      { label: "Contracts", click: () => navigate("/agency/contracts") },
      { label: "Revenue / Stripe", click: () => navigate("/agency/stripe") },
      { label: "Invoices", click: () => navigate("/agency/invoices") },
      { label: "Pipeline", click: () => navigate("/agency/pipeline") },
      { type: "separator" },
      { label: "Agent Fleet (408)", click: () => navigate("/agency/fleet") },
      { label: "Agent Registry", click: () => navigate("/agency/agents") },
      { label: "Capabilities", click: () => navigate("/agency/capabilities") },
      { type: "separator" },
      { label: "Scraping Dashboard", click: () => navigate("/agency/scraping") },
      { label: "Strategy Teasers", click: () => navigate("/agency/teasers") },
      { label: "Social Media Hub", click: () => navigate("/agency/social") },
      { label: "Client Portals", click: () => navigate("/agency/portals") },
    ]},
    { label: "Studios", submenu: [
      { label: "VoiceBox", click: () => navigate("/voicebox") },
      { label: "Obsidian Vault (9,754 files)", click: () => navigate("/obsidian") },
      { label: "GTM Studio", click: () => navigate("/rig-gtm") },
      { label: "LinkedIn Studio", click: () => navigate("/rig-linkedin") },
      { label: "Design Studio", click: () => navigate("/rig-design") },
      { label: "Strategy Studio", click: () => navigate("/rig-strategy") },
      { label: "App Studio", click: () => navigate("/rig-app") },
      { label: "SEO", click: () => navigate("/seo") },
      { label: "Video Studio", click: () => navigate("/video") },
      { label: "Ultraplan", click: () => navigate("/ultraplan") },
    ]},
    { label: "Agents", submenu: [
      { label: "Hermes", click: () => navigate("/hermes") },
      { label: "Claude", click: () => navigate("/claude") },
      { label: "Codex", click: () => navigate("/codex") },
      { label: "Gemini", click: () => navigate("/gemini") },
      { label: "Jarvis (Daily Briefing)", click: () => navigate("/jarvis") },
      { label: "OpenClaw", click: () => navigate("/openclaw") },
    ]},
    { label: "Tools", submenu: [
      { label: "Command Palette", accelerator: "CmdOrCtrl+K", click: () => { if (mainWindow) mainWindow.webContents.send("open-command-palette"); } },
      { type: "separator" },
      { label: "RIG Doctrine", click: () => navigate("/rig-doctrine") },
      { label: "Proof Packets", click: () => navigate("/rig-proof") },
      { label: "Deviation Engines", click: () => navigate("/rig-deviation") },
      { label: "3D Lattice", click: () => navigate("/rig-lattice") },
      { label: "1000x Loop", click: () => navigate("/rig-1000x") },
      { label: "Harnesses", click: () => navigate("/rig-harness") },
      { type: "separator" },
      { label: "Open Logs", click: () => { fs.mkdirSync(LOG_DIR, { recursive: true }); shell.openPath(LOG_DIR); } },
      { label: "Open Source", click: () => shell.openPath(path.join(os.homedir(), "Developer", "rig-os-agency")) },
      { label: "Open Obsidian Vault", click: () => shell.openPath(path.join(os.homedir(), "Documents", "JakeStudio")) },
    ]},
    { label: "Window", submenu: [
      { role: "minimize" }, { role: "zoom" }, { type: "separator" },
      { role: "front" },
    ]},
    { label: "Help", submenu: [
      { label: "RIG Documentation", click: () => shell.openExternal("https://github.com/RIGIntelligence/rig-os-agency") },
      { label: "Hermes Agent Docs", click: () => shell.openExternal("https://hermes-agent.nousresearch.com/docs") },
      { type: "separator" },
      { label: "Check for Updates", click: () => { /* TODO */ } },
    ]},
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Jarvis morning briefing notification
function startJarvisChecker() {
  // Check every 5 minutes if it's 7 AM (within 5 min window)
  jarvisCheckInterval = setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Fire at 7:00 AM
    if (hour === 7 && minute >= 0 && minute < 5) {
      // Fetch the Jarvis briefing
      http.get(`${APP_URL}/api/agency/jarvis`, (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          try {
            const briefing = JSON.parse(data);
            // Show notification
            if (Notification.isSupported()) {
              new Notification({
                title: "☀️ Good Morning Mike!",
                body: briefing.greeting || "Jarvis has your briefing ready.",
                silent: false,
              }).show();
            }
            log("[jarvis] Morning briefing notification sent");
          } catch (e) {
            log("[jarvis] Briefing parse error:", e.message);
          }
        });
      }).on("error", (e) => {
        log("[jarvis] Briefing fetch error:", e.message);
      });
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// IPC handlers
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("get-app-path", () => APP_DIR);

app.whenReady().then(async () => {
  // Set dock icon
  if (process.platform === "darwin") {
    const iconPath = path.join(__dirname, "assets", "icon.png");
    if (fs.existsSync(iconPath)) {
      app.dock.setIcon(iconPath);
    }
  }

  createMenu();
  try {
    await startApp();
    createWindow();
    createTray();
    startJarvisChecker();
    log("[rig-agent-os] Production app started successfully");
  } catch (error) {
    log("[rig-agent-os] startup failed", error.stack || String(error));
    // Show error window
    createWindow();
    mainWindow.loadURL(`data:text/html,<h1 style="color:white;background:#0a0a0f;padding:40px;font-family:sans-serif">RIG Agent OS failed to start.<br><br>Error: ${error.message}<br><br>Check logs at ${LOG_DIR}</h1>`);
  }
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (mainWindow === null) createWindow(); });
app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
  if (jarvisCheckInterval) clearInterval(jarvisCheckInterval);
});