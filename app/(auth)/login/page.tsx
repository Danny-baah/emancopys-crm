"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  TrendingUp,
  Layers,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        setErrorMessage("An unexpected authentication error occurred.");
        return;
      }

      if (result.error) {
        if (result.error.includes("ACCOUNT_DEACTIVATED")) {
          setErrorMessage("This account has been deactivated. Please contact an administrator.");
        } else {
          setErrorMessage("Invalid email or password. Please verify your credentials.");
        }
        return;
      }

      toast.success("Signed in successfully");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to authentication service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[450px]">
      <div className="rounded-[28px] bg-white p-8 sm:p-11 shadow-[0_22px_55px_-12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04]">
        {/* Card Header */}
        <div className="mb-7">
          <div className="inline-block">
            <h2 className="font-serif text-[32px] sm:text-[36px] font-normal text-[#13231c] tracking-tight leading-none">
              Welcome Back
            </h2>
            {/* Hand-drawn coral/rose brush underline under 'Welcome' */}
            <svg
              className="mt-2 h-2 w-[72px] text-[#df8d93]"
              viewBox="0 0 72 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4.8C16 2.2 42 2 70 5.2"
                stroke="currentColor"
                strokeWidth="3.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm text-[#677770]">
            Sign in to access your EmanCopys CRM workspace.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/90 p-3 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-[#182922]"
            >
              Corporate Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9992] pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="name@emancopys.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#e1e6e3] bg-white text-sm text-[#182922] placeholder:text-[#9fa9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-[#182922]"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9992] pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full h-12 pl-10 pr-11 rounded-xl border border-[#e1e6e3] bg-white text-sm text-[#182922] placeholder:text-[#9fa9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9992] hover:text-[#182922] transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`h-4 w-4 rounded-[5px] flex items-center justify-center transition-colors ${
                  rememberMe
                    ? "bg-[#df8d93] text-white"
                    : "border border-[#ccd5d0] bg-white"
                }`}
              >
                {rememberMe && <Check className="h-3 w-3 stroke-[3]" />}
              </button>
              <span className="text-xs text-[#2c3d36] font-normal">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={() =>
                toast.info("Please contact your CRM administrator to reset your credentials.")
              }
              className="text-xs font-semibold text-[#083d34] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] active:bg-[#063029] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="h-4 w-4 stroke-[2.2]" />
              </>
            )}
          </button>
        </form>

        {/* Footer separator */}
        <div className="relative mt-9 pt-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#e2e7e4]" />
          </div>
          <div className="relative bg-white px-3.5 text-xs text-[#708078] font-normal">
            EmanCopys CRM
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#fbf8f5]">
      {/* LEFT BRAND PANEL (Deep pine green) */}
      <section className="relative w-full lg:w-[47%] bg-[#062e26] text-white flex flex-col justify-between overflow-hidden p-8 sm:p-12 lg:p-16 shrink-0">
        {/* Subtle decorative layered curves in top-left */}
        <div className="absolute top-0 left-0 w-80 h-80 pointer-events-none opacity-40">
          <svg viewBox="0 0 400 400" fill="none" className="w-full h-full">
            <path
              d="M-50 -50 C120 -20 220 80 200 240 C190 320 120 380 -50 400 Z"
              fill="#093d33"
            />
            <path
              d="M-50 -50 C80 20 160 110 140 210 C120 300 60 340 -50 350 Z"
              fill="#0d483c"
            />
          </svg>
        </div>

        {/* Botanical Pink Leaf Illustration in bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-[280px] sm:w-[340px] lg:w-[400px] h-[360px] sm:h-[420px] pointer-events-none z-0">
          <svg
            viewBox="0 0 400 440"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-contain"
          >
            <defs>
              {/* Soft Rose / Coral gradients for 3D leaf shading */}
              <linearGradient id="leafGradTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5adb2" />
                <stop offset="55%" stopColor="#e59398" />
                <stop offset="100%" stopColor="#c86e75" />
              </linearGradient>
              <linearGradient id="leafGradLeft1" x1="0%" y1="20%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#f2a4a9" />
                <stop offset="50%" stopColor="#e0888e" />
                <stop offset="100%" stopColor="#bd646b" />
              </linearGradient>
              <linearGradient id="leafGradLeft2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f7b7bb" />
                <stop offset="60%" stopColor="#e59196" />
                <stop offset="100%" stopColor="#bf666d" />
              </linearGradient>
              <linearGradient id="leafGradRight" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f3aab0" />
                <stop offset="50%" stopColor="#df898f" />
                <stop offset="100%" stopColor="#b65e65" />
              </linearGradient>
              <linearGradient id="leafShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b85f67" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#9e4951" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="stemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#df898f" />
                <stop offset="100%" stopColor="#b85f67" />
              </linearGradient>
            </defs>

            {/* Central Stem */}
            <path
              d="M320 440 C300 370 280 280 270 200 C265 160 262 120 260 80"
              stroke="url(#stemGrad)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Top Leaf */}
            <g>
              {/* Left half */}
              <path
                d="M260 80 C240 40 248 10 262 2 C262 2 265 30 260 80 Z"
                fill="url(#leafGradTop)"
              />
              {/* Right half (shadow) */}
              <path
                d="M260 80 C265 30 262 2 262 2 C275 12 280 45 260 80 Z"
                fill="url(#leafShadow)"
              />
              <path
                d="M260 80 L262 2"
                stroke="#a64f57"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            {/* Upper-Left Leaf (Pointing up-left) */}
            <g>
              <path
                d="M266 145 C210 110 170 120 152 140 C170 175 220 180 266 145 Z"
                fill="url(#leafGradLeft1)"
              />
              {/* Shadow half */}
              <path
                d="M266 145 C220 180 170 175 152 140 C180 170 230 172 266 145 Z"
                fill="url(#leafShadow)"
              />
              <path
                d="M266 145 C220 150 180 144 152 140"
                stroke="#9e4951"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>

            {/* Upper-Right Leaf (Pointing up-right) */}
            <g>
              <path
                d="M272 175 C320 145 365 155 385 180 C365 210 320 205 272 175 Z"
                fill="url(#leafGradRight)"
              />
              <path
                d="M272 175 C320 205 365 210 385 180 C355 205 315 200 272 175 Z"
                fill="url(#leafShadow)"
              />
              <path
                d="M272 175 C315 180 355 180 385 180"
                stroke="#9e4951"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>

            {/* Mid-Left Leaf (Large prominent leaf pointing left) */}
            <g>
              <path
                d="M275 240 C195 185 135 205 108 240 C135 290 205 295 275 240 Z"
                fill="url(#leafGradLeft2)"
              />
              <path
                d="M275 240 C205 295 135 290 108 240 C145 285 215 285 275 240 Z"
                fill="url(#leafShadow)"
              />
              <path
                d="M275 240 C210 248 150 244 108 240"
                stroke="#9e4951"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>

            {/* Lower-Right Leaf */}
            <g>
              <path
                d="M295 290 C345 270 385 285 400 310 C380 338 340 330 295 290 Z"
                fill="url(#leafGradRight)"
              />
              <path
                d="M295 290 C315 295 365 298 400 310"
                stroke="#9e4951"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>

            {/* Bottom-Left Leaf (Large voluptuous leaf pointing down-left) */}
            <g>
              <path
                d="M305 345 C205 310 120 340 95 385 C130 435 220 430 305 345 Z"
                fill="url(#leafGradLeft1)"
              />
              <path
                d="M305 345 C220 430 130 435 95 385 C145 428 230 415 305 345 Z"
                fill="url(#leafShadow)"
              />
              <path
                d="M305 345 C220 370 145 380 95 385"
                stroke="#9e4951"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* Content Container (Layered above background graphics) */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Top Logo & Branding */}
          <div>
            <div className="flex items-center gap-3.5">
              {/* Stylized 'E' Monogram Logo with Pink/Coral gradient */}
              <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                <svg
                  viewBox="0 0 44 44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f5adb2" />
                      <stop offset="100%" stopColor="#d7727b" />
                    </linearGradient>
                  </defs>
                  {/* Modern curved E emblem ribbons */}
                  <path
                    d="M 10 9 C 10 9 24 9 32 9 C 34.5 9 36 10.8 34.5 13 C 33 15.2 31 15.5 28.5 15.5 L 14.5 15.5 C 12 15.5 10 17.5 10 20 L 10 9 Z"
                    fill="url(#logoGrad)"
                  />
                  <path
                    d="M 10 19 L 26 19 C 28.2 19 29.5 20.6 28.2 22.5 C 27 24.4 25.2 24.5 23 24.5 L 10 24.5 Z"
                    fill="url(#logoGrad)"
                  />
                  <path
                    d="M 10 28 L 29 28 C 31.5 28 33.5 29.8 32 32 C 30.5 34.2 28.5 35 25.5 35 L 10 35 C 7.5 35 7.5 28 10 28 Z"
                    fill="url(#logoGrad)"
                  />
                </svg>
              </div>

              <div>
                <h1 className="font-serif text-2xl font-normal tracking-normal text-white leading-tight">
                  EmanCopys
                </h1>
                <p className="text-[10px] font-semibold tracking-[0.32em] text-[#d5e0dc] uppercase pl-0.5">
                  CRM
                </p>
              </div>
            </div>

            {/* Tagline */}
            <p className="mt-14 mb-4 text-[11px] font-semibold tracking-[0.22em] text-[#9ab7b0] uppercase">
              CLIENT &amp; OPERATIONS MANAGEMENT
            </p>

            {/* Main Hero Headline */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] leading-[1.18] font-normal text-white max-w-md">
              Manage Clients,
              <br />
              Projects and Operations
              <br />
              in One Workspace
            </h2>

            {/* Sub-description */}
            <p className="mt-4 text-sm sm:text-[15px] text-[#9ab7b0] leading-relaxed max-w-[390px]">
              A centralized CRM for client relationships, sales, projects and team
              collaboration.
            </p>
          </div>

          {/* Three Feature Cards */}
          <div className="mt-12 lg:mt-16 space-y-4 max-w-md">
            {/* Feature 1 */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#0d3b32] border border-[#184e44] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#9ab7b0]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white leading-tight">
                  Client Management
                </h3>
                <p className="text-xs text-[#8daaa1] mt-0.5">
                  Keep all client information in one place
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#0d3b32] border border-[#184e44] flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[#9ab7b0]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white leading-tight">
                  Track Engagements
                </h3>
                <p className="text-xs text-[#8daaa1] mt-0.5">
                  Calls, meetings, emails and more
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#0d3b32] border border-[#184e44] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-[#9ab7b0]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white leading-tight">
                  Drive Growth
                </h3>
                <p className="text-xs text-[#8daaa1] mt-0.5">
                  Turn relationships into lasting business
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT CANVAS PANEL (Warm ivory canvas with pastel organic blobs) */}
      <section className="relative flex-1 bg-[#fbf8f5] flex items-center justify-center p-6 sm:p-10 lg:p-16 overflow-hidden min-h-[600px]">
        {/* Pastel organic corner blob (Top-Right: soft blush pink) */}
        <div className="absolute top-0 right-0 w-[240px] sm:w-[320px] lg:w-[380px] h-[220px] sm:h-[280px] pointer-events-none z-0">
          <svg
            viewBox="0 0 380 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              d="M380 0 L140 0 C130 50 150 110 200 150 C260 200 340 180 380 280 Z"
              fill="#fad8dc"
            />
          </svg>
        </div>

        {/* Pastel organic corner blob (Bottom-Right: soft sage green) */}
        <div className="absolute bottom-0 right-0 w-[260px] sm:w-[340px] lg:w-[420px] h-[200px] sm:h-[260px] pointer-events-none z-0">
          <svg
            viewBox="0 0 420 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              d="M420 260 L120 260 C150 200 210 160 270 160 C340 160 380 100 420 40 Z"
              fill="#c2d9cf"
            />
          </svg>
        </div>

        {/* Floating White Card */}
        <div className="relative z-10 w-full flex justify-center">
          <Suspense
            fallback={
              <div className="w-full max-w-[450px] rounded-[28px] bg-white p-10 shadow-lg text-center text-sm text-[#708078]">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#083d34]" />
                Loading workspace...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}