"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Mail,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { changePassword, changeEmail } from "@/lib/actions/profile";

interface SettingsAccountProps {
  email: string;
}

export function SettingsAccount({ email }: SettingsAccountProps) {
  const t = useTranslations("settings");

  // Password dialog
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Email change dialog
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError(t("account.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("account.passwordsDoNotMatch"));
      return;
    }

    setPasswordLoading(true);
    const result = await changePassword("", newPassword);
    setPasswordLoading(false);

    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordOpen(false), 1500);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);

    if (!newEmail || !newEmail.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (newEmail === email) {
      setEmailError("This is already your current email address.");
      return;
    }

    setEmailLoading(true);
    const result = await changeEmail(newEmail);
    setEmailLoading(false);

    if (result.error) {
      setEmailError(result.error);
    } else {
      setEmailSuccess(true);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.title")}</CardTitle>
        <CardDescription>{t("account.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">
                {t("account.email")}
              </Label>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEmailOpen(true);
              setEmailSuccess(false);
              setEmailError(null);
              setNewEmail("");
            }}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Change
          </Button>
        </div>

        {/* Password */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t("account.password")}</p>
              <p className="text-xs text-muted-foreground">
                {t("account.passwordHint")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPasswordOpen(true)}
          >
            {t("account.changePassword")}
          </Button>
        </div>

        {/* Danger zone */}
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-destructive">
                {t("account.deleteAccount")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("account.deleteAccountHint")}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {t("account.delete")}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Change Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address. We&apos;ll send a confirmation link
              to the new address before making the change.
            </DialogDescription>
          </DialogHeader>

          {emailSuccess ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Confirmation email sent!</p>
                  <p className="mt-1 text-xs opacity-80">
                    Check your inbox at <strong>{newEmail}</strong> and click
                    the confirmation link to complete the change.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setEmailOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleChangeEmail} className="space-y-4">
              {emailError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {emailError}
                </div>
              )}
              <div>
                <Label className="mb-1.5 block text-xs">Current email</Label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">New email address</Label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="new@example.com"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEmailOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={emailLoading}>
                  {emailLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send Confirmation
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("account.changePassword")}</DialogTitle>
            <DialogDescription>
              {t("account.changePasswordDesc")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t("account.passwordChanged")}
              </div>
            )}
            <div>
              <Label className="mb-1 block text-xs">
                {t("account.newPassword")}
              </Label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">
                {t("account.confirmPassword")}
              </Label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPasswordOpen(false)}
              >
                {t("account.cancel")}
              </Button>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("account.savePassword")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("account.deleteAccount")}
            </DialogTitle>
            <DialogDescription>
              {t("account.deleteConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("account.deleteWarning")}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              {t("account.cancel")}
            </Button>
            <Button variant="destructive" disabled>
              {t("account.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
