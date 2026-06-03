"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white px-4 text-center">
      <h1 className="text-xl font-bold text-gray-900">משהו השתבש</h1>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        אירעה שגיאה בלתי צפויה. נסה/י שוב, ואם הבעיה חוזרת — פנה/י למנהל המערכת.
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        <RotateCcw size={18} /> נסה/י שוב
      </button>
    </div>
  );
}
