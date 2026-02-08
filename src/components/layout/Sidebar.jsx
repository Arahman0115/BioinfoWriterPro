import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import deoxy from '../../assets/deoxy.png';
import {
  Home, PenLine, Search, Database, BookOpen,
  Dna, AlignLeft, Wrench, Image, FileText,
  Settings, ChevronLeft, ChevronRight, Sun, Moon, LogOut, Menu, X
} from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home, path: '/Homepage' },
  { label: 'Writer', icon: PenLine, path: '/writer' },
  { type: 'separator', label: 'Research' },
  { label: 'PubMed Search', icon: Search, path: '/research' },
  { label: 'GenBank', icon: Database, path: '/genbank-search' },
  { label: 'Semantic Search', icon: BookOpen, path: '/semantic-search' },
  { type: 'separator', label: 'Tools' },
  { label: 'BLAST', icon: Dna, path: '/blast' },
  { label: 'MAFFT', icon: AlignLeft, path: '/mafft' },
  { label: 'All Tools', icon: Wrench, path: '/tools' },
  { type: 'separator', label: 'Utilities' },
  { label: 'Figure Explanation', icon: Image, path: '/figure-explanation' },
  { label: 'Summarize', icon: FileText, path: '/summarize' },
];

export function Sidebar({ mobileOpen, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [imageFailedToLoad, setImageFailedToLoad] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed);
  }, [collapsed]);

  const handleNav = (path) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 h-14 border-b border-border shrink-0",
        collapsed && "justify-center px-0"
      )}>
        <img src={deoxy} alt="BioScribe" className="h-7 w-7 shrink-0" />
        {!collapsed && <span className="font-semibold text-foreground">BioScribe</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map((item, i) => {
          if (item.type === 'separator') {
            return (
              <div key={i} className={cn("mt-4 mb-1", collapsed && "mt-3 mb-1")}>
                {!collapsed && (
                  <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                )}
                {collapsed && <div className="mx-2 border-t border-border" />}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
                !isActive && "text-muted-foreground",
                collapsed && "justify-center px-0 py-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2 shrink-0 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        {/* Settings */}
        <button
          onClick={() => handleNav('/settings')}
          className={cn(
            "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            location.pathname === '/settings'
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              : "text-muted-foreground",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground lg:flex hidden",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* User section */}
        {currentUser && (
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md",
            collapsed && "justify-center px-0"
          )}>
            <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0 text-xs font-medium text-indigo-700 dark:text-indigo-300 overflow-hidden">
              {currentUser.photoURL && !imageFailedToLoad ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                  crossOrigin="anonymous"
                  onError={() => setImageFailedToLoad(true)}
                />
              ) : (
                <span>
                  {(currentUser.displayName || currentUser.email || '?')[0].toUpperCase()}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {currentUser.displayName || currentUser.email}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card shrink-0 transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-card border-r border-border shadow-xl">
            <div className="absolute top-3 right-3">
              <button onClick={onMobileClose} className="p-1 rounded-md hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileHeader({ onMenuClick }) {
  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-card lg:hidden">
      <button onClick={onMenuClick} className="p-2 -ml-2 rounded-md hover:bg-accent">
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <img src={deoxy} alt="BioScribe" className="h-6 w-6" />
        <span className="font-semibold text-sm">BioScribe</span>
      </div>
      <div className="w-9" /> {/* Spacer for centering */}
    </div>
  );
}
