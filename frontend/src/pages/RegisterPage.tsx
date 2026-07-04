import { useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useRegister';
import '../styles/RegisterPage.scss';

export function RegisterPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { mutate, isPending, error } = useRegister();

  const mismatchError =
    confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match.' : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (mismatchError) {
      return;
    }
    // confirmPassword never leaves the browser — only email/password go to the backend.
    mutate(
      { email, password },
      { onSuccess: () => navigate('/') },
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-page__form" onSubmit={handleSubmit}>
        <h1>TripFlow</h1>
        <h2>Register</h2>
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
          placeholder="Password (min. 8 characters)"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          required
        />
        {(mismatchError || error) && (
          <p className="auth-page__error">{mismatchError ?? error?.message}</p>
        )}
        <button type="submit" disabled={isPending || Boolean(mismatchError)}>
          {isPending ? 'Registering…' : 'Register'}
        </button>
        <p className="auth-page__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
