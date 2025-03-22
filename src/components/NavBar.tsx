"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("access_token") !== null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 w-full bg-background border-b z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">NOAH APP</h1>
        </div>
        
        <div className="flex items-center gap-2">
        <Button
              size="sm"
              onClick={() => router.push("/register")}
            >
              Sign In
            </Button>
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}