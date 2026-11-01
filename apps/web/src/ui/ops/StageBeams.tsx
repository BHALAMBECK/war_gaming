/** Aceternity-inspired background beams for staging screens only. */
export function StageBeams() {
  return (
    <div className="ops-stage-beams" aria-hidden>
      <svg
        className="ops-stage-beams-svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ops-beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(225, 6, 0, 0)" />
            <stop offset="45%" stopColor="rgba(225, 6, 0, 0.55)" />
            <stop offset="55%" stopColor="rgba(255, 242, 0, 0.35)" />
            <stop offset="100%" stopColor="rgba(225, 6, 0, 0)" />
          </linearGradient>
        </defs>
        <path
          className="ops-beam ops-beam-a"
          d="M-80 120 C 280 80, 520 200, 900 40 L 1280 0"
          fill="none"
          stroke="url(#ops-beam-grad)"
          strokeWidth="1.2"
        />
        <path
          className="ops-beam ops-beam-b"
          d="M-60 320 C 200 280, 480 420, 820 260 L 1300 180"
          fill="none"
          stroke="url(#ops-beam-grad)"
          strokeWidth="0.9"
        />
        <path
          className="ops-beam ops-beam-c"
          d="M-40 520 C 320 480, 560 620, 960 440 L 1280 380"
          fill="none"
          stroke="url(#ops-beam-grad)"
          strokeWidth="0.7"
        />
      </svg>
    </div>
  );
}
