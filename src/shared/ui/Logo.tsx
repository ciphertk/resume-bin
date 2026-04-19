interface LogoProps {
  size?: number;
  color?: string;
  accent?: string;
}

export function Logo({ size = 24, color = 'currentColor', accent }: LogoProps) {
  const a = accent ?? color;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M6 11h20l-1.5 14a4 4 0 0 1-4 3.5h-9a4 4 0 0 1-4-3.5L6 11z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M11 11V8a5 5 0 0 1 10 0v3"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
      <circle cx="16" cy="18" r="2.4" fill={a} />
    </svg>
  );
}
