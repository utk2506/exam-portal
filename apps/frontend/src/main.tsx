import React from "react";
import ReactDOM from "react-dom/client";

import { AppRouter } from "./app/router";
import { QueryProvider } from "./app/providers/query-provider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  </React.StrictMode>
);
