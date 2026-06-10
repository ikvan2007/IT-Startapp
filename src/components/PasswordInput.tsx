"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  id?: string;
  className?: string;
};

export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  required,
  minLength,
  id,
  className,
}: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className={className}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        title={visible ? "Скрыть пароль" : "Показать пароль"}
        aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
      >
        {visible ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M21.12 8.223A10.485 10.485 0 0112 4.5c-2.291 0-4.474.182-6.647.514m10.322 10.322a10.477 10.477 0 01-4.675 2.675M12 21.75c2.291 0 4.474-.182 6.647-.514M3.98 15.777a10.477 10.477 0 002.675 4.675M21.12 15.777a10.485 10.485 0 01-4.675 2.675" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5s8.573 3.007 9.963 7.178c.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5s-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}
