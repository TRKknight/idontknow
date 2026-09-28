import PhysiologyWidget from "../physiology_widget.jsx";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle.jsx";

function getInitialTheme() {
  var m = location.search.match(/[?&]dark=(\d)/);
  return m && m[1] === '1' ? 'dark' : 'light';
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const mountedRef = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    function handler(e) {
      if (e.data && e.data.type === 'theme') {
        setTheme(e.data.dark ? 'dark' : 'light');
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    // Track user-initiated changes only. Reporting the initial mount would
    // race the parent's theme postMessage and can echo a stale ?dark= value
    // back up, flipping the parent theme.
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    try { window.parent.postMessage({ type: 'theme-from-physio', dark: theme === 'dark' }, '*'); } catch(e) {}
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }

  return (
    <>
      <div className="app-toolbar" style={{ display: 'none' }}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
      <PhysiologyWidget />
    </>
  );
}