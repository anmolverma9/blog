'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  User,
  Lock,
  AtSign,
  Globe,
  Briefcase,
  Mail,
  BadgeCheck,
} from 'lucide-react';

type Tab = 'profile' | 'password';

interface ProfileData {
  name: string;
  email: string;
  role: string;
  bio: string;
  social_twitter: string;
  social_facebook: string;
  social_linkedin: string;
}

interface StatusMsg {
  type: 'success' | 'error';
  text: string;
}

export default function ProfileClient() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    name: '', email: '', role: '', bio: '',
    social_twitter: '', social_facebook: '', social_linkedin: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState<StatusMsg | null>(null);

  // Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<StatusMsg | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name || '',
            email: data.email || '',
            role: data.role || '',
            bio: data.bio || '',
            social_twitter: data.social_twitter || '',
            social_facebook: data.social_facebook || '',
            social_linkedin: data.social_linkedin || '',
          });
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const showStatus = (setter: (s: StatusMsg | null) => void, type: 'success' | 'error', text: string) => {
    setter({ type, text });
    setTimeout(() => setter(null), 4000);
  };

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (res.ok) {
        showStatus(setProfileStatus, 'success', 'Profile updated successfully.');
      } else {
        showStatus(setProfileStatus, 'error', data.error || 'Failed to save profile.');
      }
    } catch {
      showStatus(setProfileStatus, 'error', 'An unexpected error occurred.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      showStatus(setPwdStatus, 'error', 'New passwords do not match.');
      return;
    }
    if (newPwd.length < 8) {
      showStatus(setPwdStatus, 'error', 'Password must be at least 8 characters.');
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd, confirm_password: confirmPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        showStatus(setPwdStatus, 'success', 'Password changed successfully.');
      } else {
        showStatus(setPwdStatus, 'error', data.error || 'Failed to change password.');
      }
    } catch {
      showStatus(setPwdStatus, 'error', 'An unexpected error occurred.');
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-extrabold text-2xl shrink-0 shadow-sm">
          {profile.name.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{profile.name || 'My Account'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm text-slate-500">{profile.email}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <BadgeCheck className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">{profile.role}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-orange-500' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-5">

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">Account Details</CardTitle>
              <CardDescription>Your login credentials and display name.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Display Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    className="h-10 border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email Address</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="h-10 border-slate-200"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">Author Bio</CardTitle>
              <CardDescription>Shown on your public author profile and article pages.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                placeholder="Write a short bio about yourself..."
                className="h-28 text-sm border-slate-200 resize-none"
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">Social Links</CardTitle>
              <CardDescription>Linked from your public author page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                  <AtSign className="h-4 w-4 text-sky-500" />
                </div>
                <Input
                  value={profile.social_twitter}
                  onChange={(e) => setProfile(p => ({ ...p, social_twitter: e.target.value }))}
                  placeholder="https://twitter.com/yourhandle"
                  className="h-10 border-slate-200 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-indigo-500" />
                </div>
                <Input
                  value={profile.social_facebook}
                  onChange={(e) => setProfile(p => ({ ...p, social_facebook: e.target.value }))}
                  placeholder="https://facebook.com/yourprofile"
                  className="h-10 border-slate-200 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
                <Input
                  value={profile.social_linkedin}
                  onChange={(e) => setProfile(p => ({ ...p, social_linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/yourname"
                  className="h-10 border-slate-200 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={profileSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-6 shadow-md shadow-orange-500/10 flex items-center gap-1.5"
            >
              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile
            </Button>
            {profileStatus && (
              <div className={`flex items-center gap-1.5 text-sm font-semibold animate-in fade-in duration-200 ${
                profileStatus.type === 'success' ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {profileStatus.type === 'success'
                  ? <CheckCircle className="h-4 w-4" />
                  : <AlertCircle className="h-4 w-4" />
                }
                {profileStatus.text}
              </div>
            )}
          </div>
        </form>
      )}

      {/* ── Password Tab ── */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="space-y-5">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">Change Password</CardTitle>
              <CardDescription>Use a strong password with at least 8 characters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Current Password</label>
                <Input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="Enter your current password"
                  className="h-10 border-slate-200"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">New Password</label>
                <Input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="h-10 border-slate-200"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`h-10 border-slate-200 ${
                    confirmPwd && newPwd !== confirmPwd ? 'border-red-300 focus:border-red-400' : ''
                  }`}
                  required
                  autoComplete="new-password"
                />
                {confirmPwd && newPwd !== confirmPwd && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Strength indicator */}
              {newPwd && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[8, 12, 16].map((len) => (
                      <div
                        key={len}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          newPwd.length >= len
                            ? newPwd.length >= 16 ? 'bg-emerald-500' : newPwd.length >= 12 ? 'bg-orange-400' : 'bg-amber-400'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {newPwd.length < 8 ? 'Too short' : newPwd.length < 12 ? 'Fair' : newPwd.length < 16 ? 'Good' : 'Strong'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={pwdSaving || (!!confirmPwd && newPwd !== confirmPwd)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-6 shadow-md shadow-orange-500/10 flex items-center gap-1.5"
            >
              {pwdSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Update Password
            </Button>
            {pwdStatus && (
              <div className={`flex items-center gap-1.5 text-sm font-semibold animate-in fade-in duration-200 ${
                pwdStatus.type === 'success' ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {pwdStatus.type === 'success'
                  ? <CheckCircle className="h-4 w-4" />
                  : <AlertCircle className="h-4 w-4" />
                }
                {pwdStatus.text}
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
