import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

type AuthMode = "login" | "register";

export function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "admin@rigatti.com.br",
    password: "123456"
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    companyMode: "create" as "create" | "join" | "cliente",
    companyName: "",
    companySlug: ""
  });

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(loginForm);
      navigate("/dashboard");
    } catch (currentError) {
      setError(currentError instanceof ApiError ? currentError.message : "Falha ao entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.companyMode === "create" ? "admin" : "cliente",
        companyName: registerForm.companyMode === "create" ? registerForm.companyName : undefined,
        companySlug:
          registerForm.companyMode === "join" ? registerForm.companySlug || undefined : undefined
      });
      navigate("/dashboard");
    } catch (currentError) {
      setError(currentError instanceof ApiError ? currentError.message : "Falha ao registrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <div className="auth-logo-badge">
          <img src="/logo-rigatti.webp" alt="Clínica Rigatti" className="auth-logo" />
        </div>
        <h1>
          Método Rigatti de <em>transformação estética.</em>
        </h1>
        <p>
          Plataforma exclusiva para gestão de tratamentos, agendamentos e atendimento inteligente
          com dados reais da clínica.
        </p>

        <div className="feature-grid">
          <article className="feature-card">
            <strong>Isolamento por clínica</strong>
            <span>Cada unidade gerencia seu próprio catálogo de tratamentos.</span>
          </article>
          <article className="feature-card">
            <strong>Gestão com controle</strong>
            <span>Admins editam procedimentos. Clientees consultam e indicam.</span>
          </article>
          <article className="feature-card">
            <strong>Agente especializado</strong>
            <span>IA que consulta tratamentos reais antes de responder pacientes.</span>
          </article>
        </div>
      </section>

      <section className="auth-card">
        <div className="tab-strip">
          <button
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === "register" ? "tab active" : "tab"}
            onClick={() => setMode("register")}
            type="button"
          >
            Registro
          </button>
        </div>

        {mode === "login" ? (
          <form className="stack" onSubmit={handleLogin}>
            <div>
              <h2>Acesso restrito</h2>
              <p className="muted">Entre com suas credenciais para acessar a plataforma.</p>
            </div>

            <label className="field">
              <span>Email</span>
              <input
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                type="email"
                required
              />
            </label>

            <label className="field">
              <span>Senha</span>
              <input
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                type="password"
                required
              />
            </label>

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form className="stack" onSubmit={handleRegister}>
            <div>
              <h2>Criar acesso</h2>
              <p className="muted">Crie uma nova unidade ou entre em uma existente via slug.</p>
            </div>

            <label className="field">
              <span>Nome</span>
              <input
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span>Email</span>
                <input
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, email: event.target.value }))
                  }
                  type="email"
                  required
                />
              </label>

              <label className="field">
                <span>Senha</span>
                <input
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, password: event.target.value }))
                  }
                  type="password"
                  required
                />
              </label>
            </div>

            <label className="field">
              <span>Tipo de conta</span>
              <select
                value={registerForm.companyMode}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    companyMode: event.target.value as "create" | "join" | "cliente"
                  }))
                }
              >
                <option value="create">Admin — criar nova unidade</option>
                <option value="join">Admin — entrar em unidade existente</option>
                <option value="cliente">Cliente — acesso ao catálogo completo</option>
              </select>
            </label>

            <div className="success-banner">
              {registerForm.companyMode === "create"
                ? "Ao criar uma unidade, a conta nasce como administrador."
                : registerForm.companyMode === "join"
                  ? "Ao entrar em uma unidade existente, a conta nasce como administrador."
                  : "Clientes visualizam tratamentos de todas as unidades e podem filtrar por unidade."}
            </div>

            {registerForm.companyMode === "create" ? (
              <label className="field">
                <span>Nome da unidade</span>
                <input
                  value={registerForm.companyName}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      companyName: event.target.value
                    }))
                  }
                  placeholder="Ex.: Clínica Rigatti"
                  required
                />
              </label>
            ) : null}

            {registerForm.companyMode === "join" ? (
              <label className="field">
                <span>Slug da unidade</span>
                <input
                  value={registerForm.companySlug}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, companySlug: event.target.value }))
                  }
                  placeholder="clinica-rigatti"
                  required
                />
              </label>
            ) : null}

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Criando..." : "Criar conta"}
            </button>
          </form>
        )}

        {error ? <div className="error-banner">{error}</div> : null}
      </section>
    </div>
  );
}
