'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { toast } from 'sonner';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string;
    image?: string | null;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    router.push('/');
    router.refresh();
  };

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary dark:bg-primary flex items-center justify-center text-white dark:text-primary-foreground text-sm font-medium">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            initials
          )}
        </div>
        <span className="hidden sm:block text-sm font-medium">
          {user.name || user.email}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground500 dark:text-muted-foreground truncate">
              {user.email}
            </p>
          </div>

          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            Profile
          </Link>

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Settings
          </Link>

          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-destructive dark:text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
