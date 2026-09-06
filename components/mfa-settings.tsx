"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Shield,
  Smartphone,
  Key,
  Loader2,
  Trash2,
  CheckCircle,
  Plus,
} from "lucide-react";

export function MFASettings() {
  const [factors, setFactors] = useState<
    { id: string; factor_type: "totp" | "passkey"; friendly_name?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEnrollingTotp, setIsEnrollingTotp] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const supabase = createClient();

  const fetchFactors = useCallback(async () => {
    try {
      setLoading(true);
      const unified: {
        id: string;
        factor_type: "totp" | "passkey";
        friendly_name?: string;
      }[] = [];

      try {
        const { data: mfaData } = await supabase.auth.mfa.listFactors();
        const verifiedFactors =
          mfaData?.all?.filter(
            (f: { status: string }) => f.status === "verified",
          ) || [];
        verifiedFactors.forEach((f: { id: string; friendly_name?: string }) => {
          unified.push({
            id: f.id,
            factor_type: "totp",
            friendly_name: f.friendly_name || "Authenticator App",
          });
        });
      } catch {}

      try {
        if (supabase.auth.passkey) {
          const { data: passkeys } = await supabase.auth.passkey.list();
          if (passkeys && Array.isArray(passkeys)) {
            passkeys.forEach((p: { id: string; friendly_name?: string }) => {
              unified.push({
                id: p.id,
                factor_type: "passkey",
                friendly_name: p.friendly_name || "Passkey",
              });
            });
          }
        }
      } catch {}

      setFactors(unified);
    } catch (err: unknown) {
      if (err instanceof Error)
        setError(err.message || "Failed to load security factors.");
      else setError("Failed to load security factors.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  const startTotpEnrollment = async () => {
    try {
      setError("");
      setSuccess("");
      setEnrolling(true);

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (enrollError) throw enrollError;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
      setIsEnrollingTotp(true);
    } catch (err: unknown) {
      if (err instanceof Error)
        setError(err.message || "Failed to start TOTP enrollment.");
      else setError("Failed to start TOTP enrollment.");
    } finally {
      setEnrolling(false);
    }
  };

  const verifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setEnrolling(true);

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId,
        });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      setSuccess("Authenticator app added successfully!");
      setIsEnrollingTotp(false);
      setVerifyCode("");
      fetchFactors();
    } catch (err: unknown) {
      if (err instanceof Error)
        setError(err.message || "Failed to verify code.");
      else setError("Failed to verify code.");
    } finally {
      setEnrolling(false);
    }
  };

  const startPasskeyEnrollment = async () => {
    try {
      setError("");
      setSuccess("");
      setEnrolling(true);

      const { error: enrollError } = await supabase.auth.registerPasskey();

      if (enrollError) throw enrollError;

      setSuccess("Passkey added successfully!");
      fetchFactors();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message.includes("not enabled") ||
          err.message.includes("disabled")
        ) {
          setError(
            "Passkeys are not enabled in your Supabase project. Go to your Supabase Dashboard > Authentication > Passkeys (BETA) on the left sidebar to enable it.",
          );
        } else {
          setError(
            err.message ||
              "Failed to register passkey. Your browser may not support it or the prompt was cancelled.",
          );
        }
      } else {
        setError("Failed to register passkey.");
      }
    } finally {
      setEnrolling(false);
    }
  };

  const removeFactor = async (factor: {
    id: string;
    factor_type: "totp" | "passkey";
  }) => {
    const label =
      factor.factor_type === "totp" ? "authenticator app" : "passkey";
    if (!window.confirm(`Are you sure you want to remove this ${label}?`))
      return;

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      if (factor.factor_type === "totp") {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: factor.id,
        });
        if (unenrollError) throw unenrollError;
      } else {
        const { error: delError } = await supabase.auth.passkey.delete({
          passkeyId: factor.id,
        });
        if (delError) throw delError;
      }

      setSuccess("Removed successfully.");
      fetchFactors();
    } catch (err: unknown) {
      if (err instanceof Error)
        setError(err.message || "Failed to remove factor.");
      else setError("Failed to remove factor.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Multi-Factor Authentication (MFA)
        </h3>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
        Add extra security to your account with two-factor authentication.
      </p>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {factors.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Active Factors
              </h4>
              {factors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center gap-3">
                    {factor.factor_type === "totp" ? (
                      <Smartphone className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <Key className="w-4 h-4 text-zinc-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {factor.factor_type === "totp"
                          ? "Authenticator App"
                          : factor.friendly_name || "Passkey"}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {factor.factor_type === "totp" ? "TOTP" : "WebAuthn"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFactor(factor)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove factor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No active security factors.
              </p>
            </div>
          )}

          {!isEnrollingTotp && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={startTotpEnrollment}
                disabled={enrolling}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
              >
                {enrolling && !isEnrollingTotp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Authenticator App
              </button>

              <button
                onClick={startPasskeyEnrollment}
                disabled={enrolling}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
              >
                {enrolling && !isEnrollingTotp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                Add Passkey
              </button>
            </div>
          )}

          {isEnrollingTotp && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 mt-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Setup Authenticator App
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Scan the QR code below with your authenticator app (like Google
                Authenticator, Authy, etc.).
              </p>

              <div className="flex justify-center bg-white p-4 rounded-xl">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Can&apos;t scan the QR code? Use this secret:
                </p>
                <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded mt-1 inline-block">
                  {totpSecret}
                </code>
              </div>

              <form onSubmit={verifyTotp} className="space-y-3 pt-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={verifyCode}
                    onChange={(e) =>
                      setVerifyCode(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="123456"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors text-center tracking-widest text-lg"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      if (factorId) {
                        try {
                          await supabase.auth.mfa.unenroll({ factorId });
                        } catch (err) {
                          console.error(
                            "Failed to cleanup unverified factor",
                            err,
                          );
                        }
                      }
                      setIsEnrollingTotp(false);
                      setVerifyCode("");
                      setFactorId("");
                      setTotpSecret("");
                      setQrCode("");
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enrolling || verifyCode.length !== 6}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-70 transition-colors"
                  >
                    {enrolling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Verify & Save"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
