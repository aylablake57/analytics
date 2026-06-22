'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import authService from '@/lib/services/authService';
import { FaSignOutAlt, FaChartBar, FaFileAlt } from 'react-icons/fa';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    setShowDropdown(false);
    router.push('/auth/login');
  };

  if (!ready) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900 to-purple-900 backdrop-blur-md border-b border-purple-500/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:inline">Analytics Hub</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-gray-300 hover:text-white flex items-center gap-2 transition">
              <FaChartBar className="text-purple-400" />
              Dashboard
            </Link>
            <Link href="/posts" className="text-gray-300 hover:text-white flex items-center gap-2 transition">
              <FaFileAlt className="text-purple-400" />
              Posts
            </Link>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(o => !o)}
              className="flex items-center gap-3 hover:bg-purple-500/20 px-4 py-2 rounded-lg transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span className="text-white font-medium hidden sm:inline">{user?.name}</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-purple-500/30 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-purple-500/20">
                  <p className="text-white font-semibold text-sm">{user?.name}</p>
                  <p className="text-gray-400 text-xs">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-gray-300 hover:bg-red-500/20 hover:text-red-400 flex items-center gap-2 transition"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
