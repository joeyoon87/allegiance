import { ReactNode } from "react";

const inputClasses =
  "w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-slate/60 focus:border-ink focus:outline-none focus:ring-2 focus:ring-gold/50";

export function Field({
  label,
  htmlFor,
  error,
  required,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-gold-dark"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}
