import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Wordmark } from "@/components/layout/Wordmark";
import { currentAdminEmail } from "@/auth";
import { getAdmin } from "@/lib/admin/auth";
import { signInFailedPath } from "@/lib/sd-offer";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (await getAdmin()) redirect("/admin");

  // Auth.js sends every failed sign-in here, including a learner who backed out at Google.
  if (error) {
    const jar = await cookies();
    const back = signInFailedPath(jar.get("__Secure-authjs.callback-url")?.value ?? jar.get("authjs.callback-url")?.value);
    if (back) redirect(back);
  }

  // Signed in with Google, but not on the allowlist: say so plainly instead of
  // looping. A company code sign-in gets the Google button instead.
  const signedInAs = await currentAdminEmail();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Wordmark className="text-2xl" />
          <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.18em] text-muted">Admin access</p>
        </div>
        <div className="card p-6 sm:p-8">
          {signedInAs ? (
            <div className="flex flex-col gap-4">
              <h1 className="display text-2xl">Not an admin account</h1>
              <p className="text-sm text-muted">
                You are signed in as <strong className="text-ink">{signedInAs}</strong>, which is not on the admin list.
                Ask an existing admin to add this email, or sign out and use a different account.
              </p>
              <SignOutButton />
            </div>
          ) : (
            <>
              <h1 className="display text-2xl">Sign in</h1>
              <p className="mt-2 text-sm text-muted">Access is limited to approved Klymb.ai email addresses.</p>
              <LoginForm error={error ? "Google sign-in did not complete. Please try again." : undefined} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
