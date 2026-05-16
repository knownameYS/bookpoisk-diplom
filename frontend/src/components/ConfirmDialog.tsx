type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Остаться',
  onConfirm,
  onCancel,
  busy = false
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[color:rgba(8,6,5,0.72)] p-4 backdrop-blur-md">
      <div className="surface-panel w-full max-w-md p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">Подтверждение</p>
        <h3 className="mt-3 text-2xl font-semibold text-[color:var(--text)]">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-soft" disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary" disabled={busy}>
            {busy ? 'Выходим...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
