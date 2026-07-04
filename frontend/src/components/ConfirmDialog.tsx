import type { JSX } from 'react';
import '../styles/wizard.scss';
import '../styles/ConfirmDialog.scss';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Reuses the wizard modal's backdrop/card/button shell (wizard.scss) for
// visual consistency — the same reuse NewVacationModal already does.
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element {
  return (
    <div className="wizard-modal__backdrop" onClick={onCancel}>
      <div className="wizard-modal wizard-step confirm-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="wizard-step__actions">
          <button type="button" onClick={onCancel} disabled={isPending}>
            Cancel
          </button>
          <button type="button" className="confirm-dialog__danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
