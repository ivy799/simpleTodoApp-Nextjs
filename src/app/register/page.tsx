"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import Loader from "../../components/loader";
import { useEffect } from "react";

export default function RegisterPage() {
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
      const res = await fetch("/api/tasks/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registrasi gagal");
      }

      if (data.success) {
        toast.success("Registrasi berhasil! Silakan login");
        router.push("/login");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
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
        <div className="text-center">
          <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
          <p className="text-muted-foreground mt-2">
            Masukkan detail untuk membuat akun
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input name="name" type="text" required placeholder="John Doe" />
          </div>

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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Daftar"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Sudah punya akun?{" "}
          <Link href="/login" className="underline hover:text-primary">
            Login disini
          </Link>
        </div>
      </div>
    </div>
  );
}