import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>,
);
