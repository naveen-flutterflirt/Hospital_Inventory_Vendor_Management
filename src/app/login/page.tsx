"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Plus, Mail, Lock, Eye, EyeOff, ShieldCheck, 
  ArrowRight, CheckCircle2, AlertCircle, Building2, 
  HelpCircle, X, RefreshCw, Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isBackendConnected } = useAuth();

  // Form states - completely empty by default (no pre-fill / no auto-login)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Central Warehouse & Main Drug Store');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Interactive UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Submit standard login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password, selectedBranch, rememberMe);
      if (res.success) {
        setSuccessMessage('Credentials authenticated! Redirecting to inventory console...');
        setTimeout(() => {
          router.push('/');
        }, 700);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please check your credentials.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle forgot password submission
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#08181E] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans selection:bg-[#17A392] selection:text-white">
      {/* Background ambient light orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#17A392]/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#125F5C]/25 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-[1320px] bg-[#0C2322]/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.6)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* LEFT COLUMN: Cinematic Hospital Showcase & Telemetry */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 xl:p-10 text-white overflow-hidden border-r border-white/10 min-h-[720px]">
          {/* Background image with gradient mask */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/medical_inventory_hero.jpg"
              alt="Medical Inventory Control Center"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover object-center filter brightness-[0.45] contrast-[1.1] scale-105"
            />
            {/* Gradient overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08181E] via-[#0A2222]/80 to-[#0A2222]/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0C2322]/40 to-[#0C2322]" />
          </div>

          {/* Top branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-[#1EB4A1] text-white w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(30,180,161,0.5)]">
                <Plus size={22} strokeWidth={3} />
              </div>
              <div>
                <span className="font-extrabold text-[17px] tracking-wide text-white block leading-tight">
                  [Hospital] Stores
                </span>
                <span className="text-[11px] text-[#8DCAC1] tracking-wider uppercase font-semibold">
                  Enterprise Inventory CRM &bull; Neon DB
                </span>
              </div>
            </div>
          </div>

          {/* Middle Value Proposition */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#1EB4A1]/20 text-[#1EB4A1] border border-[#1EB4A1]/30">
                Hospital Supply Chain OS
              </span>
              <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Secure &amp; Audited Medical Procurement.
              </h1>
              <p className="text-slate-300 text-[14px] leading-relaxed max-w-md">
                End-to-end clinical inventory governance: real-time ward indents, 3-way GRN matching, rate-contract RFQs, and capital asset AMC tracking.
              </p>
            </div>

            {/* Live Stats Pill Banner */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
                <div className="text-2xl font-bold text-white tracking-tight">₹3.42 Cr</div>
                <div className="text-[11px] text-[#879C9B] mt-0.5">Active Stock Monitored</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <Check size={11} strokeWidth={3} /> 14 Stores Synced
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-md">
                <div className="text-2xl font-bold text-white tracking-tight">99.8%</div>
                <div className="text-[11px] text-[#879C9B] mt-0.5">Vital Drug Availability</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <Check size={11} strokeWidth={3} /> Zero ICU stockouts
                </div>
              </div>
            </div>

            {/* Security Alert Card */}
            <div className="bg-gradient-to-r from-[#125F5C]/40 to-[#17A392]/20 border border-[#1EB4A1]/30 rounded-xl p-3.5 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-[#1EB4A1] flex-shrink-0 mt-0.5" />
                <div className="text-[12px]">
                  <p className="font-semibold text-white">Central Drug Store Telemetry</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Continuous 2-8°C biological refrigerator monitoring active. Automated batch expiration ladder enabled.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security / Trust Badges */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock size={12} className="text-[#1EB4A1]" /> 256-Bit TLS Security
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 size={12} className="text-[#1EB4A1]" /> Role-Based Access (RBAC)
            </span>
            <span className="text-slate-500 font-mono">v3.2.0</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Standard Password Login Terminal */}
        <div className="lg:col-span-7 bg-[#F8FAFC] flex flex-col justify-between p-6 sm:p-10 xl:p-12 text-slate-900">
          
          {/* Top Header & Mobile Logo */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="lg:hidden flex items-center gap-2.5">
                <div className="bg-[#127670] text-white w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm shadow-sm">
                  <Plus size={16} strokeWidth={3} />
                </div>
                <span className="font-bold text-[15px] text-slate-800 tracking-wide">[Hospital] Stores</span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {isBackendConnected ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Neon PostgreSQL Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Offline Demo Mode
                  </span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to Inventory Console</h2>
              <p className="text-[13px] text-slate-500 mt-1">
                Access hospital purchase requests, stock ledger, vendor quotes, and GRN verification.
              </p>
            </div>

            {/* Enterprise Security Compliance Notice */}
            <div className="mb-6 bg-slate-100/90 border border-slate-200/90 rounded-xl p-3.5 flex items-start gap-3">
              <ShieldCheck size={18} className="text-[#127670] flex-shrink-0 mt-0.5" />
              <div className="text-[12px]">
                <p className="font-bold text-slate-800">Authorized Personnel Terminal</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Enter your assigned hospital credentials and workstation store facility. All session activities are cryptographically signed and logged for audit compliance.
                </p>
              </div>
            </div>

            {/* Status alerts */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[13px] flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Sign-in Notice:</span> {errorMessage}
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-[13px] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 size={17} className="text-[#127670] flex-shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {/* Industry Standard Password Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Store Branch Selection */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Assigned Store / Facility Location
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] shadow-sm appearance-none cursor-pointer font-medium"
                  >
                    <option value="Central Warehouse & Main Drug Store">Central Warehouse &amp; Main Drug Store</option>
                    <option value="Apex Pharmacy & Cold Chain Store">Apex Pharmacy &amp; Cold Chain Store</option>
                    <option value="OT & Critical Care Sub-Store">OT &amp; Critical Care Sub-Store</option>
                    <option value="Emergency & Trauma Triage Store">Emergency &amp; Trauma Triage Store</option>
                    <option value="All Branches (Executive View)">All Branches (Executive Multi-Store)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Email input */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hospital.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] shadow-sm font-medium"
                  />
                </div>
              </div>

              {/* Password input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                    Console Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setIsForgotModalOpen(true);
                      setForgotSubmitted(false);
                    }}
                    className="text-[12px] text-[#127670] font-semibold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] shadow-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember workstation */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#127670] border-slate-300 focus:ring-[#127670] cursor-pointer"
                  />
                  <span className="text-[12px] text-slate-600 font-medium">
                    Trust this terminal for 30 days
                  </span>
                </label>

                <span className="text-[11px] text-slate-400">HIPAA Protected Terminal</span>
              </div>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-[#127670] hover:bg-[#0f605b] text-white py-2.5 px-4 rounded-lg font-semibold text-[14px] shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Authenticating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Help & IT Disclaimer */}
          <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <HelpCircle size={14} className="text-slate-400" />
              <span>Need help? Contact IT Helpdesk at <strong className="text-slate-700">ext. 4401</strong></span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="hover:text-slate-700 cursor-pointer">Security Protocol</span>
              <span className="hover:text-slate-700 cursor-pointer">Privacy Statement</span>
              <span className="hover:text-slate-700 cursor-pointer">Terms of Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Forgot Password Recovery */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-50 text-[#127670] flex items-center justify-center mb-3">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Password Recovery Assistance</h3>
              <p className="text-[13px] text-slate-500 mt-1">
                Enter your registered hospital email. We will notify your department IT security lead.
              </p>
            </div>

            {forgotSubmitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-[14px] font-semibold text-slate-800">Request Dispatched</p>
                <p className="text-[12px] text-slate-500">
                  A reset verification link has been sent to <span className="font-semibold text-slate-700">{forgotEmail}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-[13px] font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="rajesh.sharma@hospital.com"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#127670]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 block mb-0.5">Hospital Security Policy:</span>
                  Password resets require approval from the Central IT Security Desk to maintain patient record HIPAA compliance.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#127670] hover:bg-[#0f605b] text-white rounded-lg text-[13px] font-semibold cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
