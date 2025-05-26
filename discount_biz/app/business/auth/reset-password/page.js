'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth';

// shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail]         = useState('');
  const [isSubmitted, setDone]    = useState(false);
  const [error, setError]         = useState('');
  const [isLoading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await resetPassword(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E2F5A] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Page heading */}
        <h2 className="mb-6 text-center text-3xl font-bold tracking-tight text-white">
          Reset your password
        </h2>

        <Card className="rounded-xl bg-white shadow-xl">
          {/* Success state */}
          {isSubmitted ? (
            <CardContent className="pt-8 pb-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>

              <CardTitle className="mt-4 text-gray-900">
                Password reset email sent
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                We&apos;ve sent a link to <span className="font-medium">{email}</span>.
                Please check your inbox.
              </CardDescription>

              <Button variant="link" className="mt-4 text-[#FF7139]" asChild>
                <Link href="/business/auth/login">Return to login</Link>
              </Button>
            </CardContent>
          ) : (
            <>
              {/* Form header */}
              <CardHeader>
                <CardTitle className="text-gray-900">Reset password</CardTitle>
                <CardDescription className="text-gray-600">
                  Enter your email and we&apos;ll send you a reset link.
                </CardDescription>
              </CardHeader>

              {/* Form body */}
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#FF7139] hover:bg-[#e6632e] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending…' : 'Send reset link'}
                  </Button>
                </form>
              </CardContent>

              {/* Footer link */}
              <CardFooter className="justify-center pb-6">
                <Button variant="link" className="text-[#FF7139]" asChild>
                  <Link href="/business/auth/login">Back to login</Link>
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
