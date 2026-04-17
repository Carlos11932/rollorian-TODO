import { auth } from '@/lib/auth';
import { GoogleSignInButton } from './google-sign-in-button';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect('/');

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">checklist</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-on-surface font-headline tracking-tight leading-none">
              rollorian
            </h1>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant/60 mt-1">
              TODO
            </p>
          </div>
        </div>

        {/* Sign in card */}
        <div className="w-full bg-[rgba(255,255,255,0.02)] rounded-xl p-6 flex flex-col gap-4 border border-[rgba(255,255,255,0.08)]">
          <div className="text-center">
            <p className="text-sm font-semibold text-on-surface">Accede a tu espacio</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">
              Tareas y eventos personales y en grupo
            </p>
          </div>

          <GoogleSignInButton />
        </div>

        <p className="text-xs text-on-surface-variant/40 text-center">
          Acceso restringido · Solo usuarios autorizados
        </p>
      </div>
    </div>
  );
}
