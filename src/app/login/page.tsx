import { auth, signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect('/');

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">checklist</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-primary font-headline tracking-tighter leading-none">
              rollorian
            </h1>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant/60 mt-1">
              TODO
            </p>
          </div>
        </div>

        {/* Sign in card */}
        <div className="w-full bg-surface-container-low rounded-2xl p-6 flex flex-col gap-4 border border-outline-variant/10">
          <div className="text-center">
            <p className="text-sm font-semibold text-on-surface">Accede a tu espacio</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">
              Tareas y eventos personales y en grupo
            </p>
          </div>

          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-semibold text-sm py-3 px-4 rounded-xl transition-colors border border-outline-variant/20"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                />
              </svg>
              Continuar con Google
            </button>
          </form>
        </div>

        <p className="text-xs text-on-surface-variant/40 text-center">
          Acceso restringido · Solo usuarios autorizados
        </p>
      </div>
    </div>
  );
}
