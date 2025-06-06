// app/business/page.js

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BusinessLandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}