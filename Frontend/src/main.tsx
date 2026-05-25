import React from "react";
import ReactDOM from "react-dom/client";

import "@fontsource/fraunces/600.css";

import { App, AppProviders } from "@/app";
import "@/theme/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
