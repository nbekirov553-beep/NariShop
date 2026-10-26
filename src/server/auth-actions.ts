"use server";

import { safeRedirectPath } from "@/lib/safe-redirect";
import { signIn, signOut } from "@/server/auth";

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeRedirectPath(formData.get("redirectTo"), "/") });
}

export async function signOutAction(formData: FormData) {
  await signOut({ redirectTo: safeRedirectPath(formData.get("redirectTo"), "/") });
}
