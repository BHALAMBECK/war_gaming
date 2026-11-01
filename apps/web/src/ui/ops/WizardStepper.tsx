const STEPS = ['Template', 'Fleet', 'Sim', 'Review'] as const;

interface WizardStepperProps {
  step: number;
  onStep: (index: number) => void;
}

/** Connected step indicator (modern onboarding pattern). */
export function WizardStepper({ step, onStep }: WizardStepperProps) {
  return (
    <ol className="ops-wizard-steps" aria-label="Scenario builder progress">
      {STEPS.map((label, index) => {
        const state =
          index < step ? 'complete' : index === step ? 'current' : 'upcoming';
        return (
          <li key={label} className={state}>
            <button
              type="button"
              className="ops-wizard-step-btn"
              aria-current={index === step ? 'step' : undefined}
              onClick={() => onStep(index)}
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

export { STEPS as WIZARD_STEPS };
