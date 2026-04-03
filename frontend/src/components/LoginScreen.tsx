import { useState, type FormEvent } from 'react';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Introduce usuario y contrasena');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>GLaDos</h2>
        <div className="form-group">
          <label htmlFor="loginUser">Usuario</label>
          <input
            id="loginUser"
            type="text"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') document.getElementById('loginPass')?.focus(); }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="loginPass">Contrasena</label>
          <input
            id="loginPass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <div className="error visible">{error}</div>}
      </form>
    </div>
  );
}
