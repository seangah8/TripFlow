import { useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import '../styles/LoginPage.scss';

export function LoginPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { mutate, isPending, error } = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    mutate(
      { email, password },
      { onSuccess: () => navigate('/') },
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-page__form" onSubmit={handleSubmit}>
        <h1>TripFlow</h1>
        <h2>Log in</h2>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
        />
        {error && <p className="auth-page__error">{error.message}</p>}
        <button type="submit" disabled={isPending}>
          {isPending ? 'Logging in…' : 'Log in'}
        </button>
        <p className="auth-page__switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
