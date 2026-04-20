"use client";

import { Toaster } from "react-hot-toast";

export const ToasterProvider = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      style: {
        border: "1px solid #30363d",
        background: "#161b22",
        color: "#c9d1d9"
      }
    }}
  />
);
