import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Import simplified barrister-focused app for performance testing
import SimplifiedBarristerApp from "./SimplifiedBarristerApp";
// import App from "./App"; // Original complex version
import "./styles/components.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

root.render(
  <StrictMode>
    <SimplifiedBarristerApp />
  </StrictMode>
);
