import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateVacation } from '../hooks/useCreateVacation';
import '../styles/wizard.scss';

interface NewVacationModalProps {
  onClose: () => void;
}

// Frontend-only guardrail — no backend validation for this.
const MAX_VACATION_NAME_LENGTH = 30;

// A small standalone prompt, not the 3-step trip wizard — a vacation has nothing
// to configure beyond an optional name. Reuses the wizard's modal SCSS.
export function NewVacationModal({ onClose }: NewVacationModalProps): JSX.Element {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { mutate, isPending, error } = useCreateVacation();

  function handleCreate(): void {
    mutate(name.trim() || undefined, {
      onSuccess: (vacation) => {
        onClose();
        navigate(`/vacations/${vacation.vacationId}`);
      },
    });
  }

  return (
    <div className="wizard-modal__backdrop" onClick={onClose}>
      <div className="wizard-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="wizard-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="wizard-step">
          <h2>New Vacation</h2>

          <input
            type="text"
            className="wizard-step__input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name this vacation"
            maxLength={MAX_VACATION_NAME_LENGTH}
          />

          {error && <p className="wizard-step__error">{error.message}</p>}

          <div className="wizard-step__actions">
            <button type="button" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button type="button" onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
