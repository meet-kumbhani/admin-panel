import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";
import { GlobalProvider } from "./context/GlobalContext";
import { SoftUIControllerProvider } from "context";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <GlobalProvider>
      <SoftUIControllerProvider>
        <App />
      </SoftUIControllerProvider>
    </GlobalProvider>
  </BrowserRouter>
);
