"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
import Loader from "../../components/loader"
import { Mail, Lock, User, ArrowRight } from "lucide-react"
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget as HTMLFormElement)

    try {
      const res = await fetch("/api/tasks/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Registrasi gagal")
      }

      if (data.success) {
        toast.success("Registrasi berhasil! Silakan login")
        router.push("/login")
      }
    } catch (error) {
      console.error("Registration failed:", error)
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/10">
      {/* Overlay Loader */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader />
            <p className="text-sm text-muted-foreground animate-pulse">Memuat...</p>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md shadow-lg border-muted/30">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4 relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center p-4">
              <Image 
                src="https://www.logggos.club/logos/hivecell.svg"
                alt="logo"
                className="w-full h-full object-contain"
                width={100} height={100}
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Buat Akun Baru</CardTitle>
          <CardDescription>Masukkan detail untuk membuat akun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nama Lengkap
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="name" type="text" required placeholder="John Doe" className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="email" type="email" required placeholder="email@contoh.com" className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="password" type="password" required placeholder="••••••••" className="pl-10" />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 transition-all" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Daftar
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center border-t pt-4 gap-4">
          <div className="text-center text-sm">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login disini
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Hivecell. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  )
}

