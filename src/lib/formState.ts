export type FormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

export const idleFormState: FormState = { status: "idle", message: "" };

/** Converts a submitted <form>'s FormData into a plain object, coercing named
 *  checkboxes (absent when unchecked, "on" when checked) into booleans. */
export function formDataToObject(formData: FormData, booleanFields: string[] = []) {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  for (const key of booleanFields) {
    obj[key] = formData.get(key) === "on" || formData.get(key) === "true";
  }
  return obj;
}

/** Flattens a Zod safeParse error into the same {field: message} shape the API returns. */
export function flattenZodErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
