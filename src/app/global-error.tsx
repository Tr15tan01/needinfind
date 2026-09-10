"use client";

import { useEffect } from "react";

// This only fires if the root layout itself throws — everything else is
// caught by the closer error.tsx boundaries. Kept deliberately dependency-
// free (no fonts, no shared components) since those live in the layout
// this is meant to catch failures in.
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "1.5rem"
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>NeedInFind is temporarily unavailable</h1>
          <p style={{ marginTop: "0.5rem", color: "#555", maxWidth: "28rem" }}>
            Something went wrong loading the site. Please try again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              borderRadius: "999px",
              padding: "0.5rem 1.25rem",
              background: "#171B2E",
              color: "#FBF9F4",
              border: "none",
              cursor: "pointer"
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
