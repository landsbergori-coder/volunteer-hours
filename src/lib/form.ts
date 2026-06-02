import { z } from "zod";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const initialActionState: ActionState = {};

/** ממיר שגיאות Zod למפת שדה->הודעה. */
export function zodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.errors) {
    const key = issue.path[0]?.toString() ?? "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** עוזר לפרסור FormData עם סכמת Zod. */
export function parseForm<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData
):
  | { success: true; data: z.infer<T> }
  | { success: false; errors: Record<string, string> } {
  const raw = Object.fromEntries(formData.entries());
  const result = schema.safeParse(raw);
  if (!result.success) return { success: false, errors: zodErrors(result.error) };
  return { success: true, data: result.data };
}
