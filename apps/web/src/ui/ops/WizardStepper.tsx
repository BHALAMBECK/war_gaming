interface WizardStepperProps {
  steps: readonly string[];
  step: number;
  onStep: (index: number) => void;
}

/** Progress for the current builder. Later steps stay locked. */
export function WizardStepper({ steps, step, onStep }: WizardStepperProps) {
  return (
    <ol className="ops-wizard-steps" aria-label="Builder progress">
      {steps.map((label, index) => {
        const state =
          index < step ? 'complete' : index === step ? 'current' : 'upcoming';
        const locked = index > step;
        return (
          <li key={label} className={state}>
            <button
              type="button"
              className="ops-wizard-step-btn"
              aria-current={index === step ? 'step' : undefined}
              disabled={locked}
              onClick={() => {
                if (!locked) onStep(index);
              }}
            >
              <span className="ops-wizard-dot">{index + 1}</span>
              <span className="ops-wizard-label">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
