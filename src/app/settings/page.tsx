"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { 
  User, Shield, Save, 
  CheckCircle, AlertCircle, RefreshCw, Lock, Smartphone, 
  Trash2, Activity, X, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  api, 
  UserProfileData, 
  UserSession
} from '@/lib/api';
import { SkeletonForm } from '@/components/ui/Skeleton';

const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'security', label: 'Roles & Security', icon: Shield },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { showConfirm, toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab 1: Profile State
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Tab 2: Security State
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Auto-dismiss status messages after 3.5s
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Fetch initial data based on active tab
  const loadTabData = useCallback(async (tab: string) => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (tab === 'profile') {
        const res = await api.settings.getProfile();
        if (res.success && res.data) {
          setProfileData(res.data);
          setName(res.data.name);
          setPhone(res.data.phone || '');
          setIs2FAEnabled(Boolean(res.data.two_factor_enabled));
        }
      } else if (tab === 'security') {
        const [profileRes, sessionsRes] = await Promise.all([
          api.settings.getProfile(),
          api.settings.getSessions(),
        ]);
        if (profileRes.success && profileRes.data) {
          setIs2FAEnabled(Boolean(profileRes.data.two_factor_enabled));
        }
        if (sessionsRes.success && sessionsRes.data) {
          setSessions(sessionsRes.data);
        }
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to load configuration from server.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  // Handle Save for Profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (activeTab === 'profile') {
        const res = await api.settings.updateProfile({ name, phone });
        if (res.success && res.data) {
          setProfileData(res.data);
          setStatusMessage({ type: 'success', text: 'Profile changes saved successfully!' });
        } else {
          setStatusMessage({ type: 'error', text: res.message || 'Failed to update profile.' });
        }
      } else if (activeTab === 'security') {
        setStatusMessage({ type: 'success', text: 'Security configuration verified!' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'An unexpected network error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 10) {
      setPasswordError('Password must be at least 10 characters with uppercase, numbers, and symbols.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.settings.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.success) {
        setPasswordSuccess('Password successfully updated! Other sessions terminated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordSuccess('');
        }, 1500);
      } else {
        setPasswordError(res.message || 'Failed to update password.');
      }
    } catch {
      setPasswordError('Failed to change password. Please check your credentials.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // 2FA Toggle Handler
  const handleToggle2FA = async () => {
    const nextState = !is2FAEnabled;

    if (!nextState) {
      // Disabling 2FA is a security downgrade
      const confirmed = await showConfirm({
        title: 'Disable Two-Factor Authentication',
        message: 'Are you sure you want to disable 2FA? This lowers your hospital login security threshold.',
        confirmText: 'Disable 2FA',
        cancelText: 'Keep 2FA Enabled',
        type: 'danger',
      });
      if (!confirmed) return;
    }

    try {
      const res = await api.settings.toggle2FA(nextState);
      if (res.success && res.data) {
        setIs2FAEnabled(res.data.two_factor_enabled);
        const msg = res.data.two_factor_enabled ? '2FA has been enabled!' : '2FA has been disabled.';
        setStatusMessage({
          type: 'success',
          text: msg,
        });
        toast.success(msg, 'Security Updated');
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to toggle 2FA.' });
      toast.error('Failed to toggle 2FA.', 'Error');
    }
  };

  // Session Revocation Handler
  const handleRevokeSession = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Revoke Active Session',
      message: 'Terminate this active hospital console session? The associated browser device will be signed out immediately.',
      confirmText: 'Revoke Session',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await api.settings.revokeSession(id);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setStatusMessage({ type: 'success', text: 'Session revoked successfully.' });
        toast.success('Session terminated successfully.', 'Session Revoked');
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to revoke session.' });
      toast.error('Failed to revoke session.', 'Error');
    }
  };

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-6 font-sans h-full">
      <Header />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account &amp; Security Settings</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Manage your personal hospital credentials, contact extension, and console authentication.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {statusMessage && (
            <span
              className={cn(
                "text-[13px] font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4 px-3 py-1 rounded-md",
                statusMessage.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
              )}
            >
              {statusMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {statusMessage.text}
            </span>
          )}

          {activeTab === 'profile' && (
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 bg-[#127670] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-[#0f605b] transition-all shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} strokeWidth={2.5} />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200 min-h-[580px] overflow-hidden">
        
        {/* Responsive Tabs: Horizontal scrollable strip on mobile, vertical sidebar on desktop */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/70 p-2 sm:p-3 md:p-4 flex flex-row md:flex-col gap-1.5 md:gap-1 overflow-x-auto md:overflow-visible scrollbar-none flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer text-left whitespace-nowrap flex-shrink-0 md:w-full",
                  isActive
                    ? "bg-white text-[#127670] shadow-sm border border-slate-200 font-bold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-transparent"
                )}
              >
                <Icon size={16} className={isActive ? "text-[#127670]" : "text-slate-400"} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {isLoading ? (
            <div className="max-w-2xl py-2 animate-in fade-in duration-300">
              <SkeletonForm fields={4} />
            </div>
          ) : (
            <>
              {/* ========================================== */}
              {/* TAB 1: MY PROFILE */}
              {/* ========================================== */}
              {activeTab === 'profile' && (
                <div className="max-w-2xl animate-in fade-in duration-300">
                  <h2 className="text-lg font-bold text-slate-800 mb-6">Personal Information</h2>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Clinical Department
                      </span>
                      <p className="text-[14px] font-bold text-slate-800">
                        {profileData?.department || user?.department || 'Central Supply Chain'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm">
                        Staff Badge: <strong className="text-[#127670]">{profileData?.badge || user?.badge || 'Staff'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-slate-200 rounded-md px-3.5 py-2 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] shadow-sm font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">Work Email Address</label>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          HIPAA Verified
                        </span>
                      </div>
                      <input
                        type="email"
                        value={profileData?.email || user?.email || ''}
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2 text-[14px] text-slate-500 cursor-not-allowed font-medium"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">To change official email, contact the Central Hospital IT Desk.</p>
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Contact Phone / Work Extension</label>
                      <input
                        type="text"
                        value={phone}
                        placeholder="+91 98765 43210 (Ext. 4401)"
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-md px-3.5 py-2 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] shadow-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Assigned Facility / Workstation</label>
                      <input
                        type="text"
                        value={profileData?.branch || user?.branch || 'Central Warehouse & Main Drug Store'}
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2 text-[14px] text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Job Title / RBAC Role</label>
                      <input
                        type="text"
                        value={profileData?.role || user?.role || 'Chief Procurement Officer'}
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2 text-[14px] text-slate-500 cursor-not-allowed font-medium"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Role privileges are centrally governed by the Chief Medical Officer and IT Administrator.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB 2: ROLES & SECURITY */}
              {/* ========================================== */}
              {activeTab === 'security' && (
                <div className="max-w-3xl animate-in fade-in duration-300 space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">Security &amp; Authentication</h2>
                    <p className="text-[13px] text-slate-500">
                      Manage cryptographic login credentials, Two-Factor Authentication, and active hospital workstation sessions.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Password Card */}
                    <div className="border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-sm">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#127670] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Lock size={20} />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold text-slate-800">Console Security Password</h3>
                          <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                            Must meet NIST SP 800-63B standards (min 10 chars with mixed case, numbers, and symbols).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordError('');
                          setPasswordSuccess('');
                          setShowCurrentPassword(false);
                          setShowNewPassword(false);
                          setShowConfirmPassword(false);
                          setIsPasswordModalOpen(true);
                        }}
                        className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap text-center"
                      >
                        Change Password
                      </button>
                    </div>

                    {/* 2FA Card */}
                    <div className={cn(
                      "border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all",
                      is2FAEnabled ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white shadow-sm"
                    )}>
                      <div className="flex items-start gap-3.5">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                          is2FAEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>
                          <Smartphone size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[14px] font-bold text-slate-800">Two-Factor Authentication (2FA)</h3>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                              is2FAEnabled ? "bg-emerald-200 text-emerald-800" : "bg-slate-200 text-slate-700"
                            )}>
                              {is2FAEnabled ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                            Requires a secondary verification code on new or unverified terminal sign-ins.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggle2FA}
                        className={cn(
                          "w-full sm:w-auto px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap text-center",
                          is2FAEnabled 
                            ? "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50" 
                            : "bg-[#127670] text-white hover:bg-[#0f605b]"
                        )}
                      >
                        {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                      </button>
                    </div>
                  </div>

                  {/* Active Terminal Sessions */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-[14px] font-bold text-slate-800">Active Workstation Sessions</h3>
                        <p className="text-[12px] text-slate-500">
                          These hospital terminals currently hold valid cryptographic tokens signed for your account.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadTabData('security')}
                        className="text-[12px] font-semibold text-[#127670] flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <RefreshCw size={12} /> Refresh
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                      {sessions.length === 0 ? (
                        <div className="p-4 text-center text-[13px] text-slate-500">
                          No additional remote sessions active.
                        </div>
                      ) : (
                        sessions.map((sess) => (
                          <div key={sess.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                                <Activity size={16} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[13px] font-semibold text-slate-800">{sess.device_info}</span>
                                  {sess.is_current && (
                                    <span className="bg-teal-50 text-[#127670] border border-teal-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                      This Terminal
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  IP: {sess.ip_address} &bull; Last Active: {new Date(sess.last_active).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            {!sess.is_current && (
                              <button
                                type="button"
                                onClick={() => handleRevokeSession(sess.id)}
                                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded text-[12px] font-semibold transition-colors cursor-pointer w-fit"
                              >
                                <Trash2 size={13} /> Revoke
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL: CHANGE PASSWORD WITH EYE ICONS */}
      {/* ========================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3.5 sm:p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 relative my-auto animate-in zoom-in-95">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#127670] flex items-center justify-center mb-3">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Update Console Password</h3>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                Ensure your password is at least 10 characters and has uppercase, lowercase, numbers, and symbols.
              </p>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-[12px] flex items-center gap-2">
                <CheckCircle size={15} className="text-[#127670]" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Field 1: Current Password */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-11 py-2.5 border border-slate-300 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] font-medium shadow-sm transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field 2: New Password */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New strong password"
                    className="w-full pl-3.5 pr-11 py-2.5 border border-slate-300 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] font-medium shadow-sm transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field 3: Confirm New Password */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-3.5 pr-11 py-2.5 border border-slate-300 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] font-medium shadow-sm transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Responsive Modal Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full sm:flex-1 py-2.5 bg-[#127670] hover:bg-[#0f605b] text-white rounded-lg text-[13px] font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-all text-center"
                >
                  {isUpdatingPassword ? <RefreshCw size={14} className="animate-spin" /> : null}
                  {isUpdatingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
