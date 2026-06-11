"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, Lock, User, Shield } from "lucide-react";
import Image from "next/image";

interface LoginViewProps {
  onLogin: (user: { name: string; role: string; id: string }) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [loginType, setLoginType] = useState<"admin" | "user">("user");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzfcdevw5wZLelGrr2tNvN6-wU_OmXdfaDR6tFsOlwSQtd9TAqw9qUv0lVjzBDF-6iO/exec";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Choose sheet based on login type
      const sheetName = loginType === "admin" ? "AdminData" : "UserData";

      const response = await fetch(
        `${GOOGLE_SCRIPT_URL}?sheet=${sheetName}&action=fetch`
      );
      const result = await response.json();

      if (result.success && result.data) {
        // Skip header row
        const users = result.data.slice(1);

        // Find matching user based on sheet structure
        // For both sheets: 
        // Index 0: Serial No / Additional info
        // Index 1: Name
        // Index 2: User ID
        // Index 3: Password
        // Index 4: Role (only present in Login sheet for admin, optional in userLogin)

        const matchedUser = users.find(
          (row: string[]) =>
            row[2]?.toString() === userId && row[3]?.toString() === password
        );

        if (matchedUser) {
          // Set role based on login type
          const userRole = loginType === "admin" ? "Admin" : "User";

          onLogin({
            name: matchedUser[1],  // Name from column B (index 1)
            id: matchedUser[2],    // ID from column C (index 2)
            role: userRole,
          });
        } else {
          setError(`Invalid ${loginType === "admin" ? "Admin" : "User"} ID or Password`);
        }
      } else {
        setError(`Failed to fetch ${loginType === "admin" ? "admin" : "user"} data`);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-0 shadow-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg shadow-red-500/20">
            <Image
              src="/favicon.jpg"
              alt="Logo"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Reward System
          </CardTitle>
          <p className="text-slate-500 text-sm mt-1">
            Sign in to access your dashboard
          </p>
        </CardHeader>

        {/* Horizontal Tabs */}
        <div className="px-8">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              onClick={() => {
                setLoginType("user");
                setError("");
                setUserId("");
                setPassword("");
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${loginType === "user"
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
            >
              <User className="w-4 h-4" />
              User Login
            </button>
            <button
              onClick={() => {
                setLoginType("admin");
                setError("");
                setUserId("");
                setPassword("");
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${loginType === "admin"
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
            >
              <Shield className="w-4 h-4" />
              Admin Login
            </button>
          </div>
        </div>

        <CardContent className="p-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600 font-medium">User ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Enter your ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-10 h-11 border-slate-200 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 border-slate-200 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 transition-all mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In as {loginType === "admin" ? "Admin" : "User"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 text-center">
        <a
          href="https://www.botivate.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
        >
          Powered By <span className="font-semibold">Botivate</span>
        </a>
      </div>
    </div>
  );
}
