interface BuilderFooterProps {
  backLabel: string;
  onBack: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
}

/** One back control and, on form steps, one forward control. */
export function BuilderFooter({
  backLabel,
  onBack,
  primaryLabel,
  onPrimary,
}: BuilderFooterProps) {
  return (
    <div className="ops-builder-footer">
      <button type="button" className="ops-text-btn" onClick={onBack}>
        {backLabel}
      </button>
      {primaryLabel && onPrimary ? (
        <button
          type="button"
          className="ops-btn active ops-btn-primary"
          onClick={onPrimary}
        >
          {primaryLabel}
        </button>
      ) : null}
    </div>
  );
}
