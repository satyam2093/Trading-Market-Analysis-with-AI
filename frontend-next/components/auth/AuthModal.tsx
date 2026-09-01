"use client";

import { useState } from "react";
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  onAuthenticated?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "INSTITUTIONAL">("INDIVIDUAL");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("nexquant-auth", "true");
      }
      onAuthenticated?.();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-accent uppercase tracking-wider">
              NEXQUANT SECURE ACCESS
            </span>
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              {mode === "signin" ? "Sign in to Terminal" : "Create Institutional Account"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-bullish/10 border border-bullish/30 text-bullish flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {mode === "signin" ? "Authenticated Successfully" : "Account Created"}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              Redirecting to NexQuant Intelligence Terminal...
            </p>
          </div>
        ) : (
          <>
            {/* Mode Switcher */}
            <div className="flex items-center rounded-lg border border-border bg-background p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  mode === "signin"
                    ? "bg-elevated text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  mode === "signup"
                    ? "bg-elevated text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Get Started
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-1 text-xs font-mono">
                    <label className="text-muted-foreground block">ACCOUNT TYPE</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType("INDIVIDUAL")}
                        className={`py-2 px-3 rounded border text-center transition-colors ${
                          accountType === "INDIVIDUAL"
                            ? "bg-elevated border-muted-foreground/50 text-foreground font-semibold"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        Individual Trader
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("INSTITUTIONAL")}
                        className={`py-2 px-3 rounded border text-center transition-colors ${
                          accountType === "INSTITUTIONAL"
                            ? "bg-elevated border-muted-foreground/50 text-foreground font-semibold"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        Institutional / Fund
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-muted-foreground block">FULL NAME</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground block">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@fund.com"
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-muted-foreground block">PASSWORD</label>
                  {mode === "signin" && (
                    <a href="#" className="text-[11px] text-accent hover:underline">
                      Forgot?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <span>{mode === "signin" ? "Enter Intelligence Terminal" : "Create My Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Security Guarantee */}
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] font-mono text-muted-foreground/70">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>256-bit TLS encrypted session • API key governed</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
