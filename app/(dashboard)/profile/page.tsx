"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/components/app-provider";
import { createClient } from "@/lib/supabase/client";
import { Camera, User, Loader2, Save, CheckCircle, Lock } from "lucide-react";
import { MFASettings } from "@/components/mfa-settings";
import { ImageCropModal } from "@/components/image-crop-modal";

export default function ProfilePage() {
  const { user, setUser } = useAppContext();
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || user.role || "");

  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || "");
  const [rawImageSrc, setRawImageSrc] = useState("");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name || "");
    setUsername(user.username || user.role || "");
    setAvatarPreview(user.avatarUrl || "");
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = String(event.target?.result);
      setRawImageSrc(result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    setError("");
    e.target.value = "";
  };

  const handleCropApplied = (croppedDataUrl: string) => {
    setAvatarPreview(croppedDataUrl);
    const match = croppedDataUrl.match(
      /^data:image\/(jpeg|png|webp);base64,(.+)$/
    );
    if (match) {
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "image/jpeg" });
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      setAvatarFile(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSaveSuccess(false);

    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      let newAvatarUrl = avatarPreview;

      if (authUser && avatarFile) {
        const filePath = `${authUser.id}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { contentType: "image/jpeg", upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);
        newAvatarUrl = `${publicUrl}?t=${Date.now()}`;
      } else if (!avatarPreview && authUser) {
        newAvatarUrl = "";
      }

      const updatedUser = {
        ...user,
        name,
        username,
        role: username || user.role,
        avatarUrl: newAvatarUrl,
      };

      setUser(updatedUser);

      if (authUser) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            name,
            avatar_url: newAvatarUrl,
          })
          .eq("id", authUser.id);

        if (updateError) throw updateError;
      }

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (newPassword.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) throw passwordError;

        setNewPassword("");
        setConfirmPassword("");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setAvatarFile(null);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Profile Settings
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Update your photo and personal details.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-950 shadow-sm flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-zinc-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="text-center sm:text-left w-full">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Profile Picture
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              JPG, PNG or WEBP. Max size of 5MB.
            </p>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Upload new
              </button>
              {rawImageSrc && (
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(true)}
                  className="text-sm font-medium px-4 py-2 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 transition-colors cursor-pointer"
                >
                  Recrop
                </button>
              )}
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview("");
                    setRawImageSrc("");
                    setAvatarFile(null);
                  }}
                  className="text-sm font-medium px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Username
                </label>
                <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                  <Lock className="w-3 h-3" /> Unchangeable
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 font-medium text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  readOnly
                  disabled
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 cursor-not-allowed select-none focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Usernames are permanent and cannot be modified.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Change Password
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Leave blank to keep your current password.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Profile updated successfully!
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-70 transition-colors w-full sm:w-auto justify-center cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </form>

      <MFASettings />

      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setIsCropModalOpen(false)}
        onApply={handleCropApplied}
      />
    </div>
  );
}
