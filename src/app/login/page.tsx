"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Loader from '@/components/loader';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      const res = await fetch('/api/tasks/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password')
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      if (data.success) {
        localStorage.setItem('access_token', data.data.token.access_token);
        toast.success('Login berhasil!');
        
        // Tampilkan loader selama 1 detik sebelum redirect
        setTimeout(() => {
          router.push('/taskpage');
        }, 1000);
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 px-4 relative min-h-screen">
      {/* Overlay Loader */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader />
        </div>
      )}

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              name="email" 
              type="email" 
              required 
              placeholder="email@contoh.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}