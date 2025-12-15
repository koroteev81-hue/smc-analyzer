'use client';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined)[]) {
  return twMerge(clsx(inputs));
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-bg-secondary rounded-lg border border-gray-800', className)}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-bg-tertiary hover:bg-gray-700 text-gray-200',
    ghost: 'hover:bg-bg-tertiary text-gray-400 hover:text-white',
  };

  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const variants = {
    default: 'bg-gray-700 text-gray-200',
    success: 'bg-green-900/50 text-green-400 border border-green-700',
    danger: 'bg-red-900/50 text-red-400 border border-red-700',
    warning: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700',
  };

  return (
    <span className={cn('px-2 py-1 rounded text-xs font-medium', variants[variant])}>
      {children}
    </span>
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'bg-bg-tertiary border border-gray-700 rounded-lg px-3 py-2 text-white',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500',
        className
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Loader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}