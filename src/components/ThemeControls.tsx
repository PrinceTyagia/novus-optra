import React, { useState, useEffect } from "react";

export const ThemeControls: React.FC = () => {
  // Theme states (Dark / Light)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("novusoptra-theme") as "dark" | "light") || "dark";
  });

  // Accent color states (Purple, Cyan, Green, Amber, Red)
  const [colorTheme, setColorTheme] = useState<string>(() => {
    return localStorage.getItem("novusoptra-color") || "purple";
  });

  // Font size states (11px to 18px)
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("novusoptra-font-size");
    return saved ? parseInt(saved, 10) : 14;
  });

  // Performance mode state (Disables CPU heavy blurs and animations)
  const [performanceMode, setPerformanceMode] = useState<boolean>(() => {
    return localStorage.getItem("novusoptra-perf") === "true";
  });

  // Sync Dark/Light class name on document body
  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
    localStorage.setItem("novusoptra-theme", theme);
  }, [theme]);

  // Sync Accent Theme class name on document body
  useEffect(() => {
    document.body.classList.remove("theme-cyan", "theme-green", "theme-amber", "theme-red");
    if (colorTheme !== "purple") {
      document.body.classList.add(`theme-${colorTheme}`);
    }
    localStorage.setItem("novusoptra-color", colorTheme);
  }, [colorTheme]);

  // Sync typography scale base variable on document elements
  useEffect(() => {
    document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);
    localStorage.setItem("novusoptra-font-size", fontSize.toString());
  }, [fontSize]);

  // Sync performance class on document body
  useEffect(() => {
    if (performanceMode) {
      document.body.classList.add("perf-mode");
    } else {
      document.body.classList.remove("perf-mode");
    }
    localStorage.setItem("novusoptra-perf", performanceMode ? "true" : "false");
  }, [performanceMode]);

  return (
    <div className="global-theme-controls">
      {/* Settings/Palette Trigger Icon (always visible on the right) */}
      <div className="theme-trigger-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10a1.356 1.356 0 0 0 1.356-1.356c0-.36-.15-.69-.39-.93a1.34 1.34 0 0 1 0-1.898c.24-.24.57-.39.93-.39H15a7 7 0 0 0 7-7C22 5.373 17.523 2 12 2zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
        </svg>
      </div>

      {/* Collapsible Options Container */}
      <div className="theme-options-expand">
        <div className="color-picker-container" title="Select Accent Color">
          <button 
            className={`color-dot purple ${colorTheme === "purple" ? "active" : ""}`} 
            onClick={() => setColorTheme("purple")}
          ></button>
          <button 
            className={`color-dot cyan ${colorTheme === "cyan" ? "active" : ""}`} 
            onClick={() => setColorTheme("cyan")}
          ></button>
          <button 
            className={`color-dot green ${colorTheme === "green" ? "active" : ""}`} 
            onClick={() => setColorTheme("green")}
          ></button>
          <button 
            className={`color-dot amber ${colorTheme === "amber" ? "active" : ""}`} 
            onClick={() => setColorTheme("amber")}
          ></button>
          <button 
            className={`color-dot red ${colorTheme === "red" ? "active" : ""}`} 
            onClick={() => setColorTheme("red")}
          ></button>
        </div>

        {/* Dark / Light Toggle */}
        <button 
          className="global-theme-toggle" 
          onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        {/* Performance Mode Switch */}
        <button 
          className={`global-theme-toggle perf-mode-toggle ${performanceMode ? "active" : ""}`}
          onClick={() => setPerformanceMode(prev => !prev)}
          title={performanceMode ? "Disable Performance Mode (Enable Anim)" : "Enable Performance Mode (Disable Anim)"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </button>

        {/* Font Size Adjuster */}
        <div className="font-size-picker" title="Adjust Typography Size">
          <button 
            className="font-size-btn dec-btn" 
            onClick={() => setFontSize(prev => Math.max(11, prev - 1))} 
            disabled={fontSize <= 11}
          >
            A-
          </button>
          <span className="font-size-indicator">{fontSize}px</span>
          <button 
            className="font-size-btn inc-btn" 
            onClick={() => setFontSize(prev => Math.min(18, prev + 1))} 
            disabled={fontSize >= 18}
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
};
