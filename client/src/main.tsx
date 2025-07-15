import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  // Failed to render app
  
  // Fallback: Create a simple error display
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h1>Application Loading Error</h1>
        <p>Please refresh the page. If the problem persists, contact support.</p>
        <details>
          <summary>Technical Details</summary>
          <pre>${error}</pre>
        </details>
      </div>
    `;
  }
}
