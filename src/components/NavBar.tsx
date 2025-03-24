"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LogOut, UserPlus, LogIn, Menu } from "lucide-react"
import Link from "next/link"
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("access_token") !== null)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    setIsAuthenticated(false)
    router.push("/login")
  }

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border/40 shadow-sm z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center p-1.5">
              <Image 
                src="https://www.logggos.club/logos/hivecell.svg"
                alt="logo"
                className="w-full h-full object-contain"
                width={100} height={100}
              />
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">Hivecell</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthenticated && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push("/register")}>
              <UserPlus className="h-4 w-4" />
              Sign Up
            </Button>
          )}

          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/20 hover:bg-primary/10 transition-all"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Button size="sm" className="gap-2" onClick={() => router.push("/login")}>
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!isAuthenticated && (
                <DropdownMenuItem onClick={() => router.push("/register")} className="cursor-pointer">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </DropdownMenuItem>
              )}

              {isAuthenticated ? (
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => router.push("/login")} className="cursor-pointer">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}

