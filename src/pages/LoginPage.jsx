import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { user, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState(null);
  const [isEntryAnimating, setIsEntryAnimating] = useState(false);
  const [revealHeight, setRevealHeight] = useState('0px');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const revealContentRef = useRef(null);

  const isRegisterMode = authMode === 'register';
  const isModeSelected = authMode === 'login' || authMode === 'register';

  const handleModeSelect = (mode) => {
    setError('');
    setAuthMode(mode);
    setIsEntryAnimating(true);
    setRevealHeight('0px');
  };

  useEffect(() => {
    if (!isModeSelected || !isEntryAnimating || !revealContentRef.current) return;

    const targetHeight = `${revealContentRef.current.scrollHeight}px`;
    const frame = requestAnimationFrame(() => {
      setRevealHeight(targetHeight);
    });

    const timeout = setTimeout(() => {
      setIsEntryAnimating(false);
      setRevealHeight('auto');
    }, 450);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [isModeSelected, isEntryAnimating]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegisterMode) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch {
      setError(
        isRegisterMode
          ? 'No se pudo crear la cuenta. Verifica el correo o usa una contraseña más segura.'
          : 'No se pudo iniciar sesión. Revisa correo y contraseña.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="h-full w-full bg-[#372821] flex items-center justify-center p-4">
      <section className="w-full max-w-md p-8">
        <style>{`
          @keyframes buttonMarginEntry {
            0% { marginTop: -32px; }
            100% { marginTop: 16px; }
          }

          .animate-button-margin {
            animation: buttonMarginEntry 0.45s ease-out forwards;
          }

          .form-reveal-container {
            overflow: hidden;
            transition: height 0.45s ease-out;
          }
        `}</style>

        <h1 className="text-2xl font-black text-[#E6DAC1] mb-1">Coffee Map</h1>
        <p className="text-sm text-[#E6DAC1] mb-6">Accede o crea tu cuenta para usar el mapa.</p>

        {!isModeSelected && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleModeSelect('login')}
              className="w-full font-bold py-3 rounded-2xl transition-all bg-[#E6DAC1] hover:bg-[#C8B49A] text-[#372821]"
            >
              INICIAR SESIÓN
            </button>

            <button
              type="button"
              onClick={() => handleModeSelect('register')}
              className="w-full font-bold py-3 rounded-2xl transition-all bg-[#E6DAC1] hover:bg-[#C8B49A] text-[#372821]"
            >
              CREAR CUENTA
            </button>
          </div>
        )}

        {isModeSelected && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-0 form-animation-hook">
            <div
              className="form-reveal-container"
              style={{
                height: revealHeight,
              }}
            >
              <div ref={revealContentRef} className="flex flex-col gap-4">
                <label className="text-sm font-semibold text-[#E6DAC1]">
                  Correo
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    className="mt-1 w-full rounded-xl border border-[#E6DAC1] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="text-sm font-semibold text-[#E6DAC1]">
                  Contraseña
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                    className="mt-1 w-full rounded-xl border border-[#E6DAC1] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full font-bold py-3 rounded-2xl transition-all ${isEntryAnimating ? 'animate-button-margin' : 'mt-4'} ${submitting ? 'bg-gray-200 text-[#372821]' : 'bg-[#E6DAC1] hover:bg-[#C8B49A] text-[#372821]'}`}
            >
              {submitting ? (isRegisterMode ? 'CREANDO CUENTA...' : 'INGRESANDO...') : (isRegisterMode ? 'CREAR CUENTA' : 'INICIAR SESIÓN')}
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setEmail('');
                setPassword('');
                setIsEntryAnimating(false);
                setRevealHeight('0px');
                setAuthMode(null);
              }}
              className="text-sm font-semibold text-[#E6DAC1] hover:text-[#5a4338] transition-colors"
            >
              Volver
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default LoginPage;
