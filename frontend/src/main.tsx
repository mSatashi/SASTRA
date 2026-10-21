import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StoreProvider } from "./store";
import App from "./App";
import AccessGate from "./AccessGate";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AccessGate>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AccessGate>
    </BrowserRouter>
  </StrictMode>,
);
