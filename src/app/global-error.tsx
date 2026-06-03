"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f6fb",
          color: "#1f2937",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
          אירעה תקלה זמנית
        </h1>
        <p style={{ marginTop: "0.5rem", maxWidth: "28rem", color: "#6b7280" }}>
          ייתכן שהשרת היה עסוק לרגע. נסה/י לרענן את הדף — בדרך כלל זה נפתר מיד.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.6rem 1.2rem",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          רענון וניסיון חוזר
        </button>
      </body>
    </html>
  );
}
