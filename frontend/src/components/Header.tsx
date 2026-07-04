import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useLogout';
import { Logo } from './Logo';
import '../styles/Header.scss';

export function Header(): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  return (
    <header className="app-header">
      <Link to="/" className="app-header__brand">
        <Logo />
      </Link>
      <div className="app-header__account">
        <span className="app-header__email">{user?.email}</span>
        <button type="button" className="app-header__logout" onClick={() => logout()} disabled={isLoggingOut}>
          {isLoggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </header>
  );
}
