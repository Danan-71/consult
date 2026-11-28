interface NbciBrandMarkProps {
  className?: string;
}

/**
 * Custom interlocked diamond geometric brand mark for
 * Northern Banking Credit Intelligence (NBCI).
 */
export function NbciBrandMark({ className = 'h-6 w-6' }: NbciBrandMarkProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(18 18) rotate(45) scale(0.84) translate(-18 -18)">
        <path
          d="M 11.5 5 H 31.5 V 15 H 26.1 V 10.4 H 16.9 V 23 H 11.5 Z"
          fill="currentColor"
        />
        <path
          d="M 24.5 31 H 4.5 V 21 H 9.9 V 25.6 H 19.1 V 13 H 24.5 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
