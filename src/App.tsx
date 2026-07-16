import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ThemeControls } from "./components/ThemeControls";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [cpuUsage, setCpuUsage] = useState(24);
  const [memoryUsage, setMemoryUsage] = useState(42.8);
  const [latency, setLatency] = useState(0.4);
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError("Credentials cannot be empty.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError("");

    setTimeout(() => {
      if (username.toLowerCase() === "admin" && password === "admin") {
        setIsAuthenticated(true);
        setIsAuthenticating(false);
        addLog("Security clearance authorized. Node link established.");
      } else {
        setAuthError("Intrusion Alert: Invalid operator identifier.");
        setIsAuthenticating(false);
        addLog("Access Refused: Handshake validation failed.");
      }
    }, 1000);
  }

  async function greet() {
    if (!name.trim()) return;
    try {
      const startTime = performance.now();
      const msg = await invoke<string>("greet", { name });
      const duration = (performance.now() - startTime).toFixed(2);

      setGreetMsg(msg);
      setLatency(parseFloat(duration));
      addLog(`Rust Invocation Success: Greeted "${name}" (latency: ${duration}ms)`);
      addLog(`Response from Core: "${msg}"`);
    } catch (err) {
      addLog(`Rust Invocation Failed: ${err}`);
    }
  }

  function addLog(msg: string) {
    const time = new Date().toLocaleTimeString();
    setSystemLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 14)]);
  }

  // Simulate dashboard metric variations
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        return Math.max(5, Math.min(95, prev + delta));
      });
      setMemoryUsage((prev) => {
        const delta = parseFloat((Math.random() * 0.4 - 0.2).toFixed(1)); // -0.2 to +0.2
        return Math.max(30, Math.min(80, prev + delta));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-updater check hook
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkUpdates = async () => {
      try {
        addLog("Initiating auto-updater check...");
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (update) {
          addLog(`System update found: v${update.version} (${update.date})`);
          addLog("Downloading and installing patch...");
          let contentLength = 0;
          let downloaded = 0;
          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength || 0;
                addLog(`Downloading update pack: ${contentLength} bytes...`);
                break;
              case 'Progress':
                downloaded += event.data.chunkLength;
                break;
              case 'Finished':
                addLog('Download finished. Deploying updates...');
                break;
            }
          });
          addLog("Update installed successfully. Relaunching system...");
        } else {
          addLog("System integrity check complete. Version is up to date.");
        }
      } catch (err) {
        addLog(`Auto-updater status: offline (${err})`);
      }
    };

    const timer = setTimeout(checkUpdates, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Splash screen lifecycle hooks
  useEffect(() => {
    let label = "main";
    try {
      label = getCurrentWindow().label;
    } catch (e) {
      console.warn("Could not determine window label; defaulting to main.", e);
    }
    setWindowLabel(label);

    const splash = document.getElementById("splashscreen-wrapper");

    if (label === "main") {
      // If we are in the main dashboard window, instantly remove the splash overlay.
      if (splash) {
        splash.remove();
      }
      return;
    }

    // Otherwise, we are in the splashscreen window.
    const bar = document.getElementById("loader-bar");
    const statusText = document.getElementById("loader-status-text");
    const percentText = document.getElementById("loader-percent");

    if (!splash || !bar || !statusText || !percentText) {
      return;
    }

    const phases = [
      { max: 20, text: "Connecting to Tauri IPC Gateway..." },
      { max: 50, text: "Initializing quantum state matrix..." },
      { max: 75, text: "Loading custom graphics pipeline..." },
      { max: 92, text: "Starting Novus interface shell..." },
      { max: 100, text: "Launch operational. Welcome." }
    ];

    let currentPercent = 0;
    let phaseIndex = 0;

    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 9) + 3;
      currentPercent = Math.min(currentPercent + increment, 100);

      bar.style.width = `${currentPercent}%`;
      percentText.textContent = `${currentPercent}%`;

      if (phaseIndex < phases.length && currentPercent >= phases[phaseIndex].max) {
        statusText.textContent = phases[phaseIndex].text;
        phaseIndex++;
      }

      if (currentPercent >= 100) {
        clearInterval(interval);

        setTimeout(() => {
          splash.classList.add("fade-out");

          setTimeout(() => {
            // Ask Rust backend to close splash window and display main window
            invoke("close_splashscreen").catch((err) => {
              console.error("Failed to close splashscreen via Tauri command:", err);
              // Fallback if not running inside Tauri
              splash.remove();
            });
          }, 800);
        }, 400);
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  if (windowLabel === "splashscreen") {
    // Render nothing in the splash screen window root; let the index.html loader show.
    return null;
  }

  return (
    <div className="app-container">
      {/* Background glow effects */}
      <div className="bg-gradient-orb orb-1"></div>
      <div className="bg-gradient-orb orb-2"></div>
      <div className="bg-grid-overlay"></div>
      {/* hello */}
      {/* Hello Prince */}
      {/* Global Theme Controls */}
      {/* Global Theme Controls */}
      {/* Global Theme Controls */}
      <ThemeControls />

      {!isAuthenticated ? (
        /* Glassmorphic Logon Portal */
        <div className="workspace-card logon-portal animate-fade-in">
          <h2 className="logon-title" style={{ marginTop: "24px" }}>Novus Optra</h2>
          <p className="logon-subtitle">Authorized Access Only</p>

          <form onSubmit={handleLogin} className="logon-form">
            <div className="logon-form-group">
              <label className="logon-label">Operator Identification</label>
              <input
                type="text"
                className="neon-input logon-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter operator code (admin)"
                disabled={isAuthenticating}
              />
            </div>

            <div className="logon-form-group">
              <label className="logon-label">Quantum Security Key</label>
              <input
                type="password"
                className="neon-input logon-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter security key (admin)"
                disabled={isAuthenticating}
                autoComplete="current-password"
              />
            </div>

            {authError && <div className="logon-error animate-slide-up">{authError}</div>}

            <button type="submit" className="neon-btn logon-btn" disabled={isAuthenticating}>
              {isAuthenticating ? "Decrypting Handshake..." : "Authorize Connection"}
            </button>
          </form>

          <div className="logon-footer-ver">
            NovusOptra terminal v0.1.3
          </div>
        </div>
      ) : (
        /* Main Glassmorphic Layout */
        <div className="workspace-card">
          {/* Top Navigation Bar */}
          <header className="workspace-header">
            <div className="header-brand">
              <svg className="header-logo" width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="header-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#3b82f6" />
                    <stop offset="100%" stop-color="#ec4899" />
                  </linearGradient>
                </defs>
                <path d="M35 64 V36 L65 64 V36" stroke="url(#header-grad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="50" cy="50" r="18" stroke="#00f2fe" stroke-width="5" stroke-dasharray="80" stroke-dashoffset="10" fill="none" />
              </svg>
              <div className="header-title-container">
                <span className="header-title">Novus Optra</span>
                <span className="header-version">v0.1.3</span>
              </div>
            </div>

            <nav className="header-nav">
              <button
                className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                Dashboard
              </button>
              <button
                className={`nav-item ${activeTab === "terminal" ? "active" : ""}`}
                onClick={() => setActiveTab("terminal")}
              >
                Console Logs
              </button>
              <button
                className="nav-item lock-btn"
                onClick={() => {
                  setIsAuthenticated(false);
                  setUsername("");
                  setPassword("");
                  addLog("Session terminated: Operator locked terminal.");
                }}
              >
                Lock Portal
              </button>
            </nav>

            <div className="header-status">
              <span className="status-indicator"></span>
              <span className="status-label">NovusOptra Active</span>
            </div>
          </header>

          {/* Workspace Body */}
          <main className="workspace-body">
            {activeTab === "dashboard" ? (
              <div className="dashboard-grid animate-fade-in">
                {/* Row 1: Metrics */}
                <div className="metrics-row">
                  <div className="metric-card">
                    <div className="metric-header">
                      <span className="metric-title">Core CPU Load</span>
                      <span className="metric-icon">💻</span>
                    </div>
                    <div className="metric-value">{cpuUsage}%</div>
                    <div className="metric-bar-wrapper">
                      <div className="metric-bar" style={{ width: `${cpuUsage}%` }}></div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-header">
                      <span className="metric-title">Heap Memory</span>
                      <span className="metric-icon">🧠</span>
                    </div>
                    <div className="metric-value">{memoryUsage.toFixed(1)} MB</div>
                    <div className="metric-bar-wrapper">
                      <div className="metric-bar purple-bar" style={{ width: `${(memoryUsage / 100) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-header">
                      <span className="metric-title">Tauri IPC Latency</span>
                      <span className="metric-icon">⚡</span>
                    </div>
                    <div className="metric-value">{latency} ms</div>
                    <div className="metric-bar-wrapper">
                      <div className="metric-bar cyan-bar" style={{ width: `${Math.min(100, (latency / 5) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Interaction Panel */}
                <div className="content-row">
                  <div className="panel-card gateway-card">
                    <h3>Quantum Link Gateway</h3>
                    <p className="card-desc">Invoke native Rust methods using Tauri's messaging infrastructure.</p>

                    <div className="input-group">
                      <input
                        id="name-input"
                        type="text"
                        className="neon-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter subject name..."
                        onKeyDown={(e) => e.key === "Enter" && greet()}
                      />
                      <button onClick={greet} className="neon-btn">
                        Send Packet
                      </button>
                    </div>

                    {greetMsg && (
                      <div className="response-box animate-slide-up">
                        <div className="response-header">
                          <span>Response Decrypted</span>
                          <span className="dot-blink"></span>
                        </div>
                        <p className="response-content">{greetMsg}</p>
                      </div>
                    )}
                  </div>

                  <div className="panel-card system-card">
                    <h3>Environment Node</h3>
                    <div className="node-stats">
                      <div className="node-stat-item">
                        <span className="node-stat-label">Platform Engine</span>
                        <span className="node-stat-val font-mono text-purple">Tauri v2.0.0</span>
                      </div>
                      <div className="node-stat-item">
                        <span className="node-stat-label">View Controller</span>
                        <span className="node-stat-val font-mono text-blue">React 19 & TypeScript</span>
                      </div>
                      <div className="node-stat-item">
                        <span className="node-stat-label">Build System</span>
                        <span className="node-stat-val font-mono text-cyan">Vite 7.0 + Rustc</span>
                      </div>
                      <div className="node-stat-item">
                        <span className="node-stat-label">Connection Integrity</span>
                        <span className="node-stat-val font-mono text-green">100% Secure SSL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="console-panel animate-fade-in">
                <div className="console-header">
                  <h3>Rust Core Communication Log</h3>
                  <button className="clear-btn" onClick={() => setSystemLogs([])}>
                    Clear Terminal
                  </button>
                </div>
                <div className="console-body">
                  {systemLogs.length === 0 ? (
                    <p className="console-empty">Terminal silent. Awaiting connection packets...</p>
                  ) : (
                    systemLogs.map((log, index) => (
                      <div key={index} className="console-line">
                        <span className="console-prompt">&gt;</span>
                        <span className="console-text">{log}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="workspace-footer">
            <span>Novussoftware Private Ltd &copy; {new Date().getFullYear()}</span>
            <span>Node status: Stable</span>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
