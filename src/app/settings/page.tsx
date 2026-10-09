"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { User, Bell, Shield, Workflow, Link2, Save, Upload, CheckCircle } from 'lucide-react';

const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'security', label: 'Roles & Security', icon: Shield },
  { id: 'workflows', label: 'Approval Workflows', icon: Workflow },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 1000);
  };

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-6 font-sans h-full">
      <Header />
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-[13px] text-slate-500 mt-1">Manage your account, organization policies, and integration webhooks.</p>
        </div>
        <div className="flex items-center gap-3">
          {showSuccess && (
            <span className="text-[13px] font-bold text-[#1EB4A1] flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4">
              <CheckCircle size={14} /> Changes Saved
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#125F5C] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} strokeWidth={2.5} />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 min-h-[600px] overflow-hidden">
        
        {/* Left Sidebar Tabs */}
        <div className="w-full md:w-64 border-r border-slate-100 bg-slate-50/50 p-4 flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer text-left",
                  isActive 
                    ? "bg-white text-[#127670] shadow-sm border border-slate-200" 
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
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          
          {/* My Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Personal Information</h2>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                  <User size={32} className="text-slate-400" />
                </div>
                <div>
                  <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer mb-2">
                    <Upload size={14} /> Upload Avatar
                  </button>
                  <p className="text-[12px] text-slate-500">JPG or PNG. Max size 2MB.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">First Name</label>
                    <input 
                      type="text" 
                      defaultValue="Dr. Rajesh"
                      className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Last Name</label>
                    <input 
                      type="text" 
                      defaultValue="Sharma"
                      className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue="rajesh.sharma@hospital.com"
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Job Title / Role</label>
                  <input 
                    type="text" 
                    defaultValue="Chief Procurement Officer"
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Role changes must be approved by the System Administrator.</p>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Security & Authentication</h2>
              
              <div className="space-y-6">
                <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-800">Change Password</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5">Update your account password</p>
                  </div>
                  <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                    Update
                  </button>
                </div>

                <div className="border border-[#127670]/30 bg-[#1EB4A1]/5 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-[#127670]">Two-Factor Authentication (2FA)</h3>
                      <span className="bg-[#1EB4A1]/20 text-[#127670] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Enabled</span>
                    </div>
                    <p className="text-[13px] text-slate-600 mt-0.5">Secure your account with TOTP or SMS codes.</p>
                  </div>
                  <button className="bg-white border border-slate-200 text-[#D94432] px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                    Disable
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Workflows Tab */}
          {activeTab === 'workflows' && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Purchase Approval Workflows</h2>
              
              <div className="space-y-5">
                <div className="border border-slate-200 rounded-lg p-5">
                  <h3 className="text-[14px] font-bold text-slate-800 mb-4">Level 1: Department Head</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-slate-600">Auto-approve PRs under limit</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[13px] font-semibold">₹</span>
                      <input type="text" defaultValue="50,000" className="border border-slate-200 rounded-md px-3 py-1.5 text-[13px] w-24 text-right" />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-5">
                  <h3 className="text-[14px] font-bold text-slate-800 mb-4">Level 2: Finance Director</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-slate-600">Requires secondary approval if above</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[13px] font-semibold">₹</span>
                      <input type="text" defaultValue="2,00,000" className="border border-slate-200 rounded-md px-3 py-1.5 text-[13px] w-24 text-right" />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-5">
                  <h3 className="text-[14px] font-bold text-slate-800 mb-4">Level 3: Board of Directors</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-slate-600">Requires executive approval if above</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[13px] font-semibold">₹</span>
                      <input type="text" defaultValue="10,00,000" className="border border-slate-200 rounded-md px-3 py-1.5 text-[13px] w-24 text-right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other tabs */}
          {['notifications', 'integrations'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in-95 mt-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                {activeTab === 'notifications' ? <Bell size={24} className="text-slate-400" /> : <Link2 size={24} className="text-slate-400" />}
              </div>
              <h3 className="text-lg font-bold text-slate-800 capitalize">{activeTab} Settings</h3>
              <p className="text-[14px] text-slate-500 mt-2 max-w-sm">
                This configuration panel requires administrative privileges to modify webhook endpoints and global alert routing.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
