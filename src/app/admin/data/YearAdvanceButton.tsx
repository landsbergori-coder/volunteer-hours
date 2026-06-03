"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { advanceYearAction } from "@/actions/admin";

const PHRASE = "העבר שנה";

/** כפתור העברת שנה עם אישור בהקלדה (פעולה רחבה). */
export function YearAdvanceButton() {
  const [value, setValue] = useState("");
  const matches = value.trim() === PHRASE;

  return (
    <form action={advanceYearAction} className="space-y-3">
      <input type="hidden" name="confirm" value={value} />
      <div>
        <label className="label">
          לאישור, הקלד/י בדיוק:{" "}
          <span className="font-bold text-brand-700">{PHRASE}</span>
        </label>
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={PHRASE}
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        disabled={!matches}
        onClick={(e) => {
          if (
            !confirm(
              "להעביר את כל התלמידים שנה קדימה? תלמידי י\"ב יועברו לארכיון. השעות יישמרו."
            )
          )
            e.preventDefault();
        }}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CalendarClock size={16} /> ביצוע העברת שנה
      </button>
    </form>
  );
}
