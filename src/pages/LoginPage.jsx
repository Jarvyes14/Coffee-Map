import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { user, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isRegisterMode = authMode === 'register';
  const isLoginMode = authMode === 'login';

  const handleModeSelect = (mode) => {
    if (authMode === mode) {
      // Si ya está en ese modo, lo cerramos (toggle)
      setAuthMode(null);
      setError('');
    } else {
      // Cambiamos al nuevo modo
      setAuthMode(mode);
      setError('');
    }
  };

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
          .form-container {
            display: grid;
            grid-template-rows: 0fr;
            transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .form-container.open {
            grid-template-rows: 1fr;
          }
          
          .form-content {
            overflow: hidden;
            opacity: 0;
            transition: opacity 0.3s ease-out;
            transition-delay: 0s;
          }
          
          .form-container.open .form-content {
            opacity: 1;
            transition-delay: 0.2s;
          }
        `}</style>

        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Coffee Map Logo" className="object-contain" />
        </div>

        <div className="flex flex-col gap-4">
          {/* SECCIÓN INICIAR SESIÓN */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => handleModeSelect('login')}
              className="w-full h-min font-semibold py-1 rounded-xl transition-all z-10 relative bg-[#E6DAC1] hover:bg-[#C8B49A] text-[#372821]"
            >
              Inicia sesión
            </button>

            <div className={`form-container ${isLoginMode ? 'open' : ''}`}>
              <div className="form-content">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4 pb-2">
                  <label className="text-sm font-semibold text-[#E6DAC1]">
                    Correo
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                      className="mt-1 w-full rounded-xl border border-[#E6DAC1] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-[#E6DAC1]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#E6DAC1]">
                    Contraseña
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                      className="mt-1 w-full rounded-xl border border-[#E6DAC1] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-[#E6DAC1]"
                    />
                  </label>

                  {error && isLoginMode && <p className="text-sm text-red-400">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full h-min font-semibold py-1 rounded-xl transition-all mt-2 ${
                      submitting ? 'bg-gray-500 text-gray-300' : 'bg-[#E6DAC1] hover:bg-[#C8B49A] text-[#372821]'
                    }`}
                  >
                    {submitting ? 'Ingresando...' : 'Entrar'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* SECCIÓN CREAR CUENTA */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => handleModeSelect('register')}
              className="w-full h-min font-semibold py-1 rounded-xl transition-all z-10 relative border-2 border-[#E6DAC1] text-[#E6DAC1] hover:bg-white/10"
            >
              Crear cuenta
            </button>

            <div className={`form-container ${isRegisterMode ? 'open' : ''}`}>
              <div className="form-content">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4 pb-2">
                  <label className="text-sm font-semibold text-[#E6DAC1]">
                    Correo
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                      className="mt-1 w-full rounded-xl border border-[#E6DAC1] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-[#E6DAC1]"
                    />
                  </label>

                  <label className="text-sm font-semibold text-[#E6DAC1]">
                    Contraseña
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="new-password"
                      className="mt-1 w-full rounded-xl border border-[#E6DAC1] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-[#E6DAC1]"
                    />
                  </label>

                  {error && isRegisterMode && <p className="text-sm text-red-400">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full h-min font-semibold py-1 rounded-xl transition-all mt-2 ${
                      submitting ? 'border-2 border-gray-500 text-gray-500' : 'border-2 border-[#E6DAC1] text-[#E6DAC1] hover:bg-white/10'
                    }`}
                  >
                    {submitting ? 'Creando...' : 'Registrarse'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
