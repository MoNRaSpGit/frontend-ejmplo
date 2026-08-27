import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EjemploHomePage } from "./features/ejemplo/EjemploHomePage";
import { AppUpdateNotice } from "./shared/components/AppUpdateNotice";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <EjemploHomePage />
    <AppUpdateNotice />
    <ToastContainer
      position="bottom-right"
      autoClose={3200}
      hideProgressBar
      newestOnTop
      closeButton
      pauseOnFocusLoss={false}
      pauseOnHover
      draggable={false}
      theme="light"
    />
  </React.StrictMode>
);
