'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/lib/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          router.push('/auth/login');
          setIsAuthorized(false);
          return;
        }

        const user = await authService.getCurrentUser();
        
        if (user) {
          setIsAuthorized(true);
        } else {
          router.push('/auth/login');
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, [mounted, router]);

  // Don't render anything until we know the auth status
  if (!mounted || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
}
