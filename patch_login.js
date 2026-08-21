import fs from 'fs';

const path = 'apps/web/src/pages/Login.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('handleGuestLogin')) {
  // Add the function back
  code = code.replace(
    '  async function onSubmit(e: React.FormEvent) {',
    `  async function handleGuestLogin() {
    setEmail('guest@sigedivo.com')
    setPassword('123456')
    setError(null)
    try {
      await login('guest@sigedivo.com', '123456')
      const next = params.get('next') || '/'
      navigate(next, { replace: true })
    } catch (err: any) {
      console.error('[GuestLogin Error]', err)
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al iniciar sesión como invitado'
      setError(errorMessage)
    }
  }

  async function onSubmit(e: React.FormEvent) {`
  );

  // Add the Guest JSX back
  const guestJsx = `
        {/* Acceso Demostrativo Exclusivo: Modo Invitado (Guest) */}
        <div className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
              🌟
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-emerald-950">Acceso de Demostración (Modo Invitado)</h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  1 Clic
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                ¿Quieres explorar el sistema sin registrarte? Ingresa con el rol <strong>Invitado (guest@sigedivo.com)</strong> para ver el Roster, Calendario, Estadísticas, Pizarrón Táctico y el Manual Oficial en PDF.
              </p>
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="mt-3 w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <span>🚀 Entrar como Invitado (Modo Muestra)</span>
              </button>
            </div>
          </div>
        </div>
`;

  code = code.replace(
    /<form onSubmit=\{onSubmit\} className="space-y-4">/,
    guestJsx + '\n        <form onSubmit={onSubmit} className="space-y-4">'
  );

  fs.writeFileSync(path, code);
  console.log('Login.tsx guest access restored!');
} else {
  console.log('Login.tsx already has guest access');
}

