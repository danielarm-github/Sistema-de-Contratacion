import { ReactNode } from 'react';

interface InputProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}

export function FormField({ label, required, children, hint }: InputProps) {
  return (
    <div>
      <label className="block text-slate-700 text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
    </div>
  );
}

interface TextInputProps {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

export function TextInput({ value, onChange, placeholder, type = 'text', required }: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
    />
  );
}

interface TextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export function Textarea({ value, onChange, placeholder, rows = 3, required }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white resize-none"
    />
  );
}

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  placeholder?: string;
}

export function NumberInput({ value, onChange, min = 0, placeholder }: NumberInputProps) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={e => onChange(Number(e.target.value))}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
    />
  );
}
