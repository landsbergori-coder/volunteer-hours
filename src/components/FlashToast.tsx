"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

function FlashToastInner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const flash = params.get("flash");
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!flash) return;
    setText(flash);
    setVisible(true);
    // ניקוי ה-param מה-URL כדי שלא יוצג שוב ברענון
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.delete("flash");
    router.replace(pathname + (sp.toString() ? `?${sp}` : ""), {
      scroll: false,
    });
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-800 shadow-lg">
        <CheckCircle2 size={18} className="text-green-600" />
        <span>{text}</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="mr-1 text-green-700/60 hover:text-green-900"
          aria-label="סגירה"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/** Toast גלובלי שמוצג לאחר פעולה (נקרא מפרמטר ?flash=). */
export function FlashToast() {
  return (
    <Suspense fallback={null}>
      <FlashToastInner />
    </Suspense>
  );
}
