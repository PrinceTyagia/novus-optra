import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion } from "@tauri-apps/api/app";
import { ThemeControls } from "./components/ThemeControls";
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  Customer,
  Company,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany
} from "./db";
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
  const [appVersion, setAppVersion] = useState("0.1.3");

  // Customers states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState("");
  
  // Form states
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formFullname, setFormFullname] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formLicence, setFormLicence] = useState("");
  const [formIsTemporaryClose, setFormIsTemporaryClose] = useState(false);
  const [formIsClose, setFormIsClose] = useState(false);
  const [formCustomerType, setFormCustomerType] = useState<"local" | "outstation">("local");
  const [formCompanyCode, setFormCompanyCode] = useState("");

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "local" | "outstation">("all");

  // Form Modal visibility
  const [showFormModal, setShowFormModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sub-tabs inside Master panel
  const [activeMasterTab, setActiveMasterTab] = useState("companies");

  // Companies states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companyFilterActive, setCompanyFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [companyCurrentPage, setCompanyCurrentPage] = useState(1);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Company Form states
  const [companyEditingId, setCompanyEditingId] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyLicence, setCompanyLicence] = useState("");
  const [companyLicenceExpiry, setCompanyLicenceExpiry] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyIsActive, setCompanyIsActive] = useState(true);

  // Logon Company Selection states
  const [loginCompanyId, setLoginCompanyId] = useState("");
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  async function loadCustomers() {
    setDbLoading(true);
    setDbError("");
    try {
      const data = await getCustomers();
      const filtered = (!isSuperadmin && currentCompany)
        ? data.filter(c => c.company_code === currentCompany.unique_code)
        : data;
      setCustomers(filtered);
      addLog(`SQLite DB: Fetched ${filtered.length} customer records.`);
    } catch (err: any) {
      setDbError(err?.message || "Failed to load customers.");
      addLog(`SQLite Database Error: ${err?.message || err}`);
    } finally {
      setDbLoading(false);
    }
  }

  async function loadCompanies() {
    setDbLoading(true);
    setDbError("");
    try {
      const data = await getCompanies();
      setCompanies(data);
      addLog(`SQLite DB: Fetched ${data.length} company records.`);
    } catch (err: any) {
      setDbError(err?.message || "Failed to load companies.");
      addLog(`SQLite Database Error: ${err?.message || err}`);
    } finally {
      setDbLoading(false);
    }
  }

  function resetCompanyForm() {
    setCompanyEditingId(null);
    setCompanyCode("");
    setCompanyName("");
    setCompanyEmail("");
    setCompanyAddress("");
    setCompanyLicence("");
    setCompanyLicenceExpiry("");
    setCompanyPhone("");
    setCompanyWebsite("");
    setCompanyIsActive(true);
    setShowCompanyModal(false);
  }

  function handleCompanyEditInit(comp: Company) {
    setCompanyEditingId(comp.id);
    setCompanyCode(comp.unique_code);
    setCompanyName(comp.name);
    setCompanyEmail(comp.email);
    setCompanyAddress(comp.address);
    setCompanyLicence(comp.licence);
    setCompanyLicenceExpiry(comp.licence_expiry);
    setCompanyPhone(comp.phone);
    setCompanyWebsite(comp.website);
    setCompanyIsActive(comp.is_active);
    setShowCompanyModal(true);
  }

  async function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyCode.trim() || !companyName.trim()) {
      setDbError("Company Code and Name are required.");
      return;
    }

    setDbLoading(true);
    setDbError("");

    try {
      if (companyEditingId) {
        const updatedComp: Company = {
          id: companyEditingId,
          unique_code: companyCode.trim(),
          name: companyName.trim(),
          email: companyEmail.trim(),
          address: companyAddress.trim(),
          licence: companyLicence.trim(),
          licence_expiry: companyLicenceExpiry.trim(),
          phone: companyPhone.trim(),
          website: companyWebsite.trim(),
          is_active: companyIsActive
        };
        await updateCompany(updatedComp);
        addLog(`SQLite DB: Updated company code "${companyCode.trim()}".`);
        setCompanyEditingId(null);
      } else {
        const newComp = {
          unique_code: companyCode.trim(),
          name: companyName.trim(),
          email: companyEmail.trim(),
          address: companyAddress.trim(),
          licence: companyLicence.trim(),
          licence_expiry: companyLicenceExpiry.trim(),
          phone: companyPhone.trim(),
          website: companyWebsite.trim(),
          is_active: companyIsActive
        };
        await createCompany(newComp);
        addLog(`SQLite DB: Registered company "${companyName.trim()}".`);
      }
      resetCompanyForm();
      await loadCompanies();
    } catch (err: any) {
      setDbError(err?.message || "Failed to commit company record.");
      addLog(`SQLite Database Error: ${err?.message || err}`);
    } finally {
      setDbLoading(false);
    }
  }

  async function handleCompanyDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete company "${name}"?`)) {
      return;
    }
    setDbLoading(true);
    try {
      await deleteCompany(id);
      addLog(`SQLite DB: Deleted company "${name}".`);
      await loadCompanies();
    } catch (err: any) {
      addLog(`SQLite DB Delete Failed: ${err?.message || err}`);
    } finally {
      setDbLoading(false);
    }
  }

  async function handleCustomerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formCode.trim() || !formFullname.trim()) {
      setDbError("Customer Code and Full Name are required.");
      return;
    }

    setDbLoading(true);
    setDbError("");

    try {
      if (isEditing) {
        const updatedCust: Customer = {
          id: isEditing,
          code: formCode.trim(),
          fullname: formFullname.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          country: formCountry.trim(),
          licence: formLicence.trim(),
          is_temporary_close: formIsTemporaryClose,
          is_close: formIsClose,
          customer_type: formCustomerType,
          company_code: isSuperadmin ? formCompanyCode : (formCompanyCode || currentCompany?.unique_code || "")
        };
        await updateCustomer(updatedCust);
        addLog(`SQLite DB: Updated customer code "${formCode.trim()}".`);
        setIsEditing(null);
      } else {
        const newCust = {
          code: formCode.trim(),
          fullname: formFullname.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          country: formCountry.trim(),
          licence: formLicence.trim(),
          is_temporary_close: formIsTemporaryClose,
          is_close: formIsClose,
          customer_type: formCustomerType,
          company_code: isSuperadmin ? formCompanyCode : (currentCompany?.unique_code || "")
        };
        const created = await createCustomer(newCust);
        addLog(`SQLite DB: Created customer "${created.fullname}" with code "${created.code}".`);
      }

      resetForm();
      await loadCustomers();
    } catch (err: any) {
      setDbError(err?.message || "Database action failed.");
      addLog(`SQLite DB Action Failed: ${err?.message || err}`);
    } finally {
      setDbLoading(false);
    }
  }

  function resetForm() {
    setIsEditing(null);
    setFormCode("");
    setFormFullname("");
    setFormCity("");
    setFormState("");
    setFormCountry("");
    setFormLicence("");
    setFormIsTemporaryClose(false);
    setFormIsClose(false);
    setFormCustomerType("local");
    setFormCompanyCode("");
    setShowFormModal(false);
  }

  function handleEditInit(cust: Customer) {
    setIsEditing(cust.id);
    setFormCode(cust.code);
    setFormFullname(cust.fullname);
    setFormCity(cust.city);
    setFormState(cust.state);
    setFormCountry(cust.country);
    setFormLicence(cust.licence);
    setFormIsTemporaryClose(cust.is_temporary_close);
    setFormIsClose(cust.is_close);
    setFormCustomerType(cust.customer_type);
    setFormCompanyCode(cust.company_code || "");
    setShowFormModal(true);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) {
      return;
    }
    setDbLoading(true);
    try {
      await deleteCustomer(id);
      addLog(`SQLite DB: Deleted customer "${name}".`);
      await loadCustomers();
    } catch (err: any) {
      setDbError(err?.message || "Failed to delete customer.");
      addLog(`SQLite DB Delete Failed: ${err?.message || err}`);
    } finally {
      setDbLoading(false);
    }
  }

  useEffect(() => {
    getVersion().then(setAppVersion).catch((err) => {
      console.warn("Could not retrieve app version:", err);
    });
  }, []);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const seedAll = async () => {
      // Seed Customers
      const mockCustomerData = [
        { code: "CUST-101", fullname: "Astra Logistics", city: "Mumbai", state: "MH", country: "India", licence: "LIC-ASTRA-99", is_temporary_close: false, is_close: false, customer_type: "local" as const, company_code: "COMP-ABC" },
        { code: "CUST-102", fullname: "Apex Outstation", city: "Delhi", state: "DL", country: "India", licence: "LIC-APEX-88", is_temporary_close: false, is_close: false, customer_type: "outstation" as const, company_code: "COMP-XYZ" },
        { code: "CUST-103", fullname: "Beacon Enterprises", city: "Bangalore", state: "KA", country: "India", licence: "LIC-BEACON-77", is_temporary_close: false, is_close: false, customer_type: "local" as const, company_code: "COMP-ABC" },
        { code: "CUST-104", fullname: "Matrix Infotech", city: "Pune", state: "MH", country: "India", licence: "LIC-MATRIX-66", is_temporary_close: true, is_close: false, customer_type: "local" as const, company_code: "COMP-ABC" },
        { code: "CUST-105", fullname: "Zenith Carriers", city: "Chennai", state: "TN", country: "India", licence: "LIC-ZENITH-55", is_temporary_close: false, is_close: true, customer_type: "outstation" as const, company_code: "COMP-XYZ" },
        { code: "CUST-106", fullname: "Titanium Corp", city: "Hyderabad", state: "TS", country: "India", licence: "LIC-TITAN-44", is_temporary_close: false, is_close: false, customer_type: "local" as const, company_code: "COMP-XYZ" }
      ];

      // Seed Companies
      const mockCompanyData = [
        { unique_code: "COMP-ABC", name: "ABC Corporation", email: "info@abccorp.com", address: "Agra, UttarPradesh, India", licence: "LIC-ABC-123", licence_expiry: "2028-12-31", phone: "+91 9999999999", website: "abccorp.com", is_active: true },
        { unique_code: "COMP-XYZ", name: "XYZ Industries", email: "sales@xyzind.com", address: "Noida, UttarPradesh, India", licence: "LIC-XYZ-987", licence_expiry: "2027-06-15", phone: "+91 8888888888", website: "xyzind.com", is_active: true }
      ];

      try {
        const currentCustomers = await getCustomers();
        for (const item of mockCustomerData) {
          const exists = currentCustomers.some(c => c.code.toLowerCase() === item.code.toLowerCase());
          if (!exists) {
            await createCustomer(item);
          }
        }
        await loadCustomers();

        const currentCompanies = await getCompanies();
        for (const item of mockCompanyData) {
          const exists = currentCompanies.some(c => c.unique_code.toLowerCase() === item.unique_code.toLowerCase());
          if (!exists) {
            await createCompany(item);
          }
        }
        await loadCompanies();

        // Auto select first company node as default
        setLoginCompanyId("superadmin");
      } catch (err) {
        console.error("Auto seeding error:", err);
      }
    };

    seedAll();
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError("Credentials cannot be empty.");
      return;
    }
    if (!loginCompanyId) {
      setAuthError("Please select a company node.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError("");

    setTimeout(() => {
      const isSuper = loginCompanyId === "superadmin";
      
      if (isSuper) {
        if (username.toLowerCase() === "superadmin" && (password === "admin" || password === "superadmin")) {
          setIsSuperadmin(true);
          setCurrentCompany({
            id: "superadmin",
            unique_code: "SUPER",
            name: "SYSTEM SUPERADMIN",
            email: "",
            address: "",
            licence: "",
            licence_expiry: "",
            phone: "",
            website: "",
            is_active: true
          });
          setIsAuthenticated(true);
          setIsAuthenticating(false);
          setActiveMasterTab("companies");
          addLog("Super Operator security clearance authorized. Super Node established.");
        } else {
          setAuthError("Access Refused: Invalid credentials for Superadmin node.");
          setIsAuthenticating(false);
          addLog("Access Refused: Superadmin handshake failed.");
        }
      } else {
        if (username.toLowerCase() === "admin" && password === "admin") {
          const selectedComp = companies.find((c) => c.id === loginCompanyId);
          setIsSuperadmin(false);
          setCurrentCompany(selectedComp || null);
          setIsAuthenticated(true);
          setIsAuthenticating(false);
          setActiveMasterTab("customers");
          addLog(`Security clearance authorized for ${selectedComp?.name || "node"}. Node link established.`);
        } else {
          setAuthError("Intrusion Alert: Invalid operator identifier.");
          setIsAuthenticating(false);
          addLog("Access Refused: Handshake validation failed.");
        }
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
          await invoke("restart_app");
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

  // Re-fetch database resources on logon session changes
  useEffect(() => {
    if (isAuthenticated) {
      loadCustomers();
      loadCompanies();
    }
  }, [isAuthenticated, isSuperadmin, currentCompany]);

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
    const splashVersion = document.getElementById("splash-version");
    if (splashVersion) {
      getVersion().then((v) => {
        splashVersion.textContent = `Platform v${v}`;
      }).catch((e) => console.warn(e));
    }

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

      <ThemeControls />

      {!isAuthenticated ? (
        /* Glassmorphic Logon Portal */
        <div className="workspace-card logon-portal animate-fade-in">
          <h2 className="logon-title" style={{ marginTop: "24px" }}>Novus Optra</h2>
          <p className="logon-subtitle">Authorized Access Only</p>

          <form onSubmit={handleLogin} className="logon-form">
            <div className="logon-form-group">
              <label className="logon-label">Select Company Node</label>
              <select
                className="filter-select"
                style={{ width: "100%", height: "42px", marginTop: "5px" }}
                value={loginCompanyId}
                onChange={(e) => setLoginCompanyId(e.target.value)}
                disabled={isAuthenticating}
              >
                <option value="superadmin">🛠️ SYSTEM SUPERADMIN</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.name.toUpperCase()} ({c.unique_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="logon-form-group">
              <label className="logon-label">Enter Your Email/user</label>
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
            NovusOptra terminal v{appVersion}
          </div>
        </div>
      ) : (
        /* Main Glassmorphic Layout with Sidebar */
        <div className="workspace-card sidebar-layout">
          {/* Left Sidebar */}
          <aside className="workspace-sidebar">
            <div className="sidebar-brand">
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
                <span className="header-version">v{appVersion}</span>
              </div>
            </div>

            <nav className="sidebar-nav">
              <button
                className={`sidebar-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <span className="sidebar-icon">💻</span>
                Dashboard
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === "master" ? "active" : ""}`}
                onClick={() => setActiveTab("master")}
              >
                <span className="sidebar-icon">📁</span>
                Master
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === "terminal" ? "active" : ""}`}
                onClick={() => setActiveTab("terminal")}
              >
                <span className="sidebar-icon">🖳</span>
                Console Logs
              </button>
            </nav>

            <div className="sidebar-footer">
              <button
                className="sidebar-nav-item lock-btn"
               onClick={() => {
                  setIsAuthenticated(false);
                  setUsername("");
                  setPassword("");
                  setCurrentCompany(null);
                  setIsSuperadmin(false);
                  addLog("Session terminated: Operator locked terminal.");
                }}
              >
                <span className="sidebar-icon">🔒</span>
                Lock Portal
              </button>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <div className="workspace-main-area">
            {/* Top Header */}
            <header className="workspace-header">
              <div className="header-brand">
                <div className="header-title-container">
                  <span className="header-title" style={{ fontSize: "16px" }}>
                    {activeTab === "dashboard" 
                      ? "System Matrix" 
                      : activeTab === "master" 
                        ? "Master Database Configuration" 
                        : "Quantum core events"}
                  </span>
                </div>
              </div>

              <div className="header-status">
                {currentCompany && (
                  <span className="header-company-name">
                    🏢 {currentCompany.name.toUpperCase()}
                  </span>
                )}
                <span className="status-indicator"></span>
                <span className="status-label">Active Node</span>
              </div>
            </header>

            {/* Center Layout (Workspace Body) */}
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
              ) : activeTab === "master" ? (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                  {/* Master sub tabs */}
                  <div className="master-sub-tabs">
                    {isSuperadmin && (
                      <button
                        className={`sub-tab-item ${activeMasterTab === "companies" ? "active" : ""}`}
                        onClick={() => setActiveMasterTab("companies")}
                      >
                        🏢 Company Setup
                      </button>
                    )}
                    <button
                      className={`sub-tab-item ${activeMasterTab === "customers" ? "active" : ""}`}
                      onClick={() => setActiveMasterTab("customers")}
                    >
                      👥 Customer Setup
                    </button>
                    <button
                      className={`sub-tab-item ${activeMasterTab === "vendors" ? "active" : ""}`}
                      onClick={() => setActiveMasterTab("vendors")}
                      disabled
                      style={{ opacity: 0.5, cursor: "not-allowed" }}
                      title="Setup panel under encryption key restriction"
                    >
                      💼 Vendor Setup (Locked)
                    </button>
                  </div>

                  {isSuperadmin && activeMasterTab === "companies" && (
                    <div className="customers-container animate-fade-in">
                      <div className="customer-list-wrapper">
                        <div className="list-header-controls">
                          <div className="search-input-wrapper">
                            <input
                              type="text"
                              className="neon-input"
                              style={{ width: "100%" }}
                              placeholder="Search companies by name, code, email, website..."
                              value={companySearchQuery}
                              onChange={(e) => {
                                setCompanySearchQuery(e.target.value);
                                setCompanyCurrentPage(1);
                              }}
                            />
                          </div>
                          <select
                            className="filter-select"
                            value={companyFilterActive}
                            onChange={(e) => {
                              setCompanyFilterActive(e.target.value as any);
                              setCompanyCurrentPage(1);
                            }}
                          >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                          </select>
                          <button
                            className="add-client-btn"
                            onClick={() => {
                              resetCompanyForm();
                              setShowCompanyModal(true);
                            }}
                          >
                            ➕ Add Company
                          </button>
                        </div>

                        <div className="customers-grid-scroll">
                          {(() => {
                            const filtered = companies.filter((c) => {
                              const matchesSearch =
                                c.name.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                                c.unique_code.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                                c.email.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                                c.website.toLowerCase().includes(companySearchQuery.toLowerCase());

                              const matchesStatus =
                                companyFilterActive === "all" ||
                                (companyFilterActive === "active" && c.is_active) ||
                                (companyFilterActive === "inactive" && !c.is_active);

                              return matchesSearch && matchesStatus;
                            });

                            if (filtered.length === 0) {
                              return (
                                <div className="no-cust-prompt">
                                  {companies.length === 0
                                    ? "No company records committed in SQLite database yet."
                                    : "No company records match the criteria."}
                                </div>
                              );
                            }

                            // Pagination calculations
                            const indexOfLastItem = companyCurrentPage * itemsPerPage;
                            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                            const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
                            const totalPages = Math.ceil(filtered.length / itemsPerPage);

                            return (
                              <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                  {currentItems.map((comp) => (
                                    <div key={comp.id} className="customer-card-item animate-slide-up">
                                      <div className="cust-info-main">
                                        <div className="cust-title-row">
                                          <span className="cust-name">{comp.name}</span>
                                          <span className="cust-code">{comp.unique_code}</span>
                                          {comp.licence && (
                                            <span className="cust-badge badge-licence">📄 {comp.licence}</span>
                                          )}
                                          {comp.licence_expiry && (
                                            <span className="cust-badge badge-closed">📅 Exp: {comp.licence_expiry}</span>
                                          )}
                                          {comp.is_active ? (
                                            <span className="cust-badge badge-local">Active</span>
                                          ) : (
                                            <span className="cust-badge badge-closed">Inactive</span>
                                          )}
                                          <span className="cust-badge badge-licence">
                                            👥 Customers: {customers.filter((c) => c.company_code === comp.unique_code).length}
                                          </span>
                                        </div>
                                        <div className="cust-details">
                                          <span>🔑 ID: {comp.id}</span>
                                          {comp.address && (
                                            <span>📍 {comp.address.toUpperCase()}</span>
                                          )}
                                          {comp.email && <span>📧 {comp.email}</span>}
                                          {comp.phone && <span>📞 {comp.phone}</span>}
                                          {comp.website && <span>🌐 {comp.website}</span>}
                                        </div>
                                      </div>
                                      <div className="cust-actions">
                                        <button
                                          className="cust-btn edit-btn"
                                          onClick={() => handleCompanyEditInit(comp)}
                                          title="Edit Record"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="cust-btn delete-btn"
                                          onClick={() => handleCompanyDelete(comp.id, comp.name)}
                                          title="Delete Record"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {totalPages > 1 && (
                                  <div className="pagination-container">
                                    <div className="pagination-info">
                                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} entries
                                    </div>
                                    <div className="pagination-controls">
                                      <button
                                        className="pagination-btn"
                                        onClick={() => setCompanyCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={companyCurrentPage === 1}
                                      >
                                        Previous
                                      </button>
                                      <span className="pagination-info" style={{ margin: "0 10px", alignSelf: "center" }}>
                                        Page {companyCurrentPage} of {totalPages}
                                      </span>
                                      <button
                                        className="pagination-btn"
                                        onClick={() => setCompanyCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={companyCurrentPage === totalPages}
                                      >
                                        Next
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMasterTab === "customers" && (
                    <div className="customers-container animate-fade-in">
                      {/* Right Side: Customers List, Search, Filter */}
                      <div className="customer-list-wrapper">
                        <div className="list-header-controls">
                          <div className="search-input-wrapper">
                            <input
                              type="text"
                              className="neon-input"
                              style={{ width: "100%" }}
                              placeholder="Search offline database by name, code, licence, city..."
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                              }}
                            />
                          </div>
                          <select
                            className="filter-select"
                            value={filterType}
                            onChange={(e) => {
                              setFilterType(e.target.value as any);
                              setCurrentPage(1);
                            }}
                          >
                            <option value="all">All Types</option>
                            <option value="local">Local</option>
                            <option value="outstation">Outstation</option>
                          </select>
                          <button
                            className="add-client-btn"
                            onClick={() => {
                              resetForm();
                              setShowFormModal(true);
                            }}
                          >
                            ➕ Add Customer
                          </button>
                        </div>

                        <div className="customers-grid-scroll">
                          {(() => {
                            const filtered = customers.filter((c) => {
                              // multitenant company code separation
                              if (!isSuperadmin && currentCompany) {
                                if (c.company_code !== currentCompany.unique_code) {
                                  return false;
                                }
                              }

                              const matchesSearch =
                                c.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.licence.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.city.toLowerCase().includes(searchQuery.toLowerCase());

                              const matchesType =
                                filterType === "all" || c.customer_type === filterType;

                              return matchesSearch && matchesType;
                            });

                            if (filtered.length === 0) {
                              return (
                                <div className="no-cust-prompt">
                                  {customers.length === 0
                                    ? "No client records committed in SQLite database yet."
                                    : "No client records match the criteria."}
                                </div>
                              );
                            }

                            // Pagination calculations
                            const indexOfLastItem = currentPage * itemsPerPage;
                            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                            const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
                            const totalPages = Math.ceil(filtered.length / itemsPerPage);

                            return (
                              <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                  {currentItems.map((cust) => (
                                    <div key={cust.id} className="customer-card-item animate-slide-up">
                                      <div className="cust-info-main">
                                        <div className="cust-title-row">
                                          <span className="cust-name">{cust.fullname}</span>
                                          <span className="cust-code">{cust.code}</span>
                                          <span className={`cust-badge badge-${cust.customer_type}`}>
                                            {cust.customer_type}
                                          </span>
                                          {isSuperadmin && cust.company_code && (
                                            <span className="cust-badge badge-company">🏢 {cust.company_code}</span>
                                          )}
                                          {cust.licence && (
                                            <span className="cust-badge badge-licence">📄 {cust.licence}</span>
                                          )}
                                          {cust.is_close && (
                                            <span className="cust-badge badge-closed">Closed</span>
                                          )}
                                          {cust.is_temporary_close && (
                                            <span className="cust-badge badge-temp-closed">Temp Closed</span>
                                          )}
                                        </div>
                                        <div className="cust-details">
                                          <span>🔑 ID: {cust.id}</span>
                                          {(cust.city || cust.state || cust.country) && (
                                            <span>📍 {[cust.city, cust.state, cust.country].filter(Boolean).join(", ").toUpperCase()}</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="cust-actions">
                                        <button
                                          className="cust-btn edit-btn"
                                          onClick={() => handleEditInit(cust)}
                                          title="Edit Record"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="cust-btn delete-btn"
                                          onClick={() => handleDelete(cust.id, cust.fullname)}
                                          title="Delete Record"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {totalPages > 1 && (
                                  <div className="pagination-container">
                                    <div className="pagination-info">
                                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} entries
                                    </div>
                                    <div className="pagination-controls">
                                      <button
                                        className="pagination-btn"
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                      >
                                        Previous
                                      </button>
                                      <span className="pagination-info" style={{ margin: "0 10px", alignSelf: "center" }}>
                                        Page {currentPage} of {totalPages}
                                      </span>
                                      <button
                                        className="pagination-btn"
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                      >
                                        Next
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
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
            <footer className="workspace-footer" style={{ padding: "12px 24px" }}>
              <span>Novussoftware Private Ltd &copy; {new Date().getFullYear()}</span>
              <span>Node status: Stable</span>
            </footer>
          </div>

          {/* Form Modal overlay */}
          {showFormModal && (
            <div className="customer-modal-overlay" onClick={() => setShowFormModal(false)}>
              <div className="customer-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{isEditing ? "Modify Customer" : "Add Customer"}</h3>
                  <button className="modal-close-btn" onClick={() => setShowFormModal(false)}>&times;</button>
                </div>

                {dbError && <div className="logon-error" style={{ marginBottom: "15px" }}>{dbError}</div>}

                <form onSubmit={handleCustomerSubmit} className="customer-form">
                  <div className="modal-grid-layout">
                    <div className="logon-form-group">
                      <label className="logon-label">Customer Code (Unique)</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. CUST-100"
                        disabled={dbLoading}
                        required
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">Full Name</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={formFullname}
                        onChange={(e) => setFormFullname(e.target.value)}
                        placeholder="e.g. John Doe"
                        disabled={dbLoading}
                        required
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">City</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="City"
                        disabled={dbLoading}
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">State</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        placeholder="State"
                        disabled={dbLoading}
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">Country</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={formCountry}
                        onChange={(e) => setFormCountry(e.target.value)}
                        placeholder="Country"
                        disabled={dbLoading}
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">Customer Type</label>
                      <select
                        className="filter-select"
                        style={{ width: "100%", marginTop: "5px", height: "38px" }}
                        value={formCustomerType}
                        onChange={(e) => setFormCustomerType(e.target.value as "local" | "outstation")}
                        disabled={dbLoading}
                      >
                        <option value="local">Local</option>
                        <option value="outstation">Outstation</option>
                      </select>
                    </div>

                    <div className="logon-form-group modal-grid-full">
                      <label className="logon-label">Licence</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={formLicence}
                        onChange={(e) => setFormLicence(e.target.value)}
                        placeholder="Licence No."
                        disabled={dbLoading}
                      />
                    </div>

                    {isSuperadmin && (
                      <div className="logon-form-group modal-grid-full">
                        <label className="logon-label">Assign to Company Node</label>
                        <select
                          className="filter-select"
                          style={{ width: "100%", marginTop: "5px", height: "38px" }}
                          value={formCompanyCode}
                          onChange={(e) => setFormCompanyCode(e.target.value)}
                          disabled={dbLoading}
                        >
                          <option value="">-- No Company Assigned --</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.unique_code}>
                              🏢 {c.name.toUpperCase()} ({c.unique_code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group-checkbox">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formIsTemporaryClose}
                          onChange={(e) => setFormIsTemporaryClose(e.target.checked)}
                          disabled={dbLoading}
                        />
                        Temporary Closed
                      </label>
                    </div>

                    <div className="form-group-checkbox">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formIsClose}
                          onChange={(e) => setFormIsClose(e.target.checked)}
                          disabled={dbLoading}
                        />
                        Closed
                      </label>
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: "20px" }}>
                    <button type="submit" className="neon-btn" disabled={dbLoading}>
                      {isEditing ? "Save Customer" : "Add Customer"}
                    </button>
                    <button type="button" className="cust-btn" onClick={resetForm} disabled={dbLoading}>
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Company Form Modal overlay */}
          {showCompanyModal && (
            <div className="customer-modal-overlay" onClick={() => setShowCompanyModal(false)}>
              <div className="customer-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{companyEditingId ? "Modify Company" : "Add Company"}</h3>
                  <button className="modal-close-btn" onClick={() => setShowCompanyModal(false)}>&times;</button>
                </div>

                {dbError && <div className="logon-error" style={{ marginBottom: "15px" }}>{dbError}</div>}

                <form onSubmit={handleCompanySubmit} className="customer-form">
                  <div className="modal-grid-layout">
                    <div className="logon-form-group">
                      <label className="logon-label">Company Code (Unique)</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={companyCode}
                        onChange={(e) => setCompanyCode(e.target.value)}
                        placeholder="e.g. COMP-ABC"
                        disabled={dbLoading}
                        required
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">Company Name</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. ABC Corporation"
                        disabled={dbLoading}
                        required
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">Email</label>
                      <input
                        type="email"
                        className="neon-input"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="e.g. info@company.com"
                        disabled={dbLoading}
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">Phone</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="e.g. +1 555-0100"
                        disabled={dbLoading}
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">Website</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="e.g. company.com"
                        disabled={dbLoading}
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">Licence</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={companyLicence}
                        onChange={(e) => setCompanyLicence(e.target.value)}
                        placeholder="Licence No."
                        disabled={dbLoading}
                      />
                    </div>

                    <div className="logon-form-group">
                      <label className="logon-label">Licence Expiry</label>
                      <input
                        type="date"
                        className="neon-input"
                        value={companyLicenceExpiry}
                        onChange={(e) => setCompanyLicenceExpiry(e.target.value)}
                        disabled={dbLoading}
                        style={{ height: "38px" }}
                      />
                    </div>

                    <div className="logon-form-group">
                      <div className="form-group-checkbox" style={{ marginTop: "28px" }}>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={companyIsActive}
                            onChange={(e) => setCompanyIsActive(e.target.checked)}
                            disabled={dbLoading}
                          />
                          Active Status
                        </label>
                      </div>
                    </div>

                    <div className="logon-form-group modal-grid-full">
                      <label className="logon-label">Address</label>
                      <textarea
                        className="neon-input"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Address info..."
                        disabled={dbLoading}
                        rows={2}
                        style={{ resize: "none", height: "60px", padding: "10px 12px" }}
                      />
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: "20px" }}>
                    <button type="submit" className="neon-btn" disabled={dbLoading}>
                      {companyEditingId ? "Save Company" : "Add Company"}
                    </button>
                    <button type="button" className="cust-btn" onClick={resetCompanyForm} disabled={dbLoading}>
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
