import React from 'react';
import { cn } from '../utils/cn';

export const AuthLayout = ({ children, className }) => {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center',
      'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950',
      className
    )}>
      <div className="w-full max-w-md px-4 py-12">
        {children}
      </div>
    </div>
  );
};

export const AuthCard = ({ children, className }) => {
  return (
    <div className={cn(
      'rounded-xl border border-slate-200 dark:border-slate-700',
      'bg-white dark:bg-slate-950',
      'shadow-lg dark:shadow-2xl',
      'p-8 space-y-6',
      className
    )}>
      {children}
    </div>
  );
};

export const AuthHeader = ({ title, subtitle, className }) => {
  return (
    <div className={cn('text-center space-y-2', className)}>
      <div className="flex items-center justify-center mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">BW</span>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export const AuthDivider = ({ text = 'OR' }) => {
  return (
    <div className="relative flex items-center my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200 dark:border-slate-700" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
          {text}
        </span>
      </div>
    </div>
  );
};

export const AuthFormGroup = ({ label, error, children, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
