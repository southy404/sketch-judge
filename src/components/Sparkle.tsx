type Props = {
  className?: string;
};

export function Sparkle({ className = "" }: Props) {
  const classes = className ? `sparkle-svg ${className}` : "sparkle-svg";
  return (
    <svg
      className={classes}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16 3 C16.7 12 17.4 13.4 28.5 16 C17.4 18.6 16.7 20 16 29 C15.3 20 14.6 18.6 3.5 16 C14.6 13.4 15.3 12 16 3 Z" />
    </svg>
  );
}
