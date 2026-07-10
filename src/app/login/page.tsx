import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Hana Trans</h1>
          <p className="mt-1 text-sm text-slate-500">Invoice Approval</p>
        </div>
        <LoginForm callbackUrl={callbackUrl ?? "/"} />
      </div>
    </div>
  );
}
