'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className, children = 'Sign Out' }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <button type="button" className={className} onClick={handleLogout}>
      {children}
    </button>
  );
}
