import Image from "next/image";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

// Where the emailed reset link lands. Supabase signs the customer in
// automatically from the link, then they choose a new password here.
export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 pb-24 pt-[150px] sm:px-6">
      <div className="card w-full rounded-3xl p-8 sm:p-10">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Gala Drinks — Wholesale Drinks Supplier"
            width={144}
            height={90}
            className="mx-auto h-[88px] w-auto"
          />
          <h1 className="mt-4 font-display text-xl font-semibold text-ink">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-body">
            Choose a new password for your trade account.
          </p>
        </div>
        <div className="mt-8">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
