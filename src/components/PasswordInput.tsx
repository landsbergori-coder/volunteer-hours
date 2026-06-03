"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** שדה סיסמה עם כפתור הצג/הסתר. */
export function PasswordInput({
  name,
  id,
  autoComplete = "current-password",
  placeholder,
}: {
  name: string;
  id?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id ?? name}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="input pl-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "הסתר סיסמה" : "הצג סיסמה"}
        className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:text-gray-700"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
