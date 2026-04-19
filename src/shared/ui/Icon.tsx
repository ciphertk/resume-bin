type IconName =
  | 'spark' | 'check' | 'plus' | 'x' | 'chev' | 'chevD'
  | 'copy' | 'gear' | 'search' | 'download' | 'filter'
  | 'briefcase' | 'user' | 'link' | 'zap' | 'tag' | 'clock'
  | 'dot' | 'moon' | 'sun' | 'grid' | 'globe' | 'mail'
  | 'pin' | 'trash' | 'sliders' | 'build';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const PATHS: Record<IconName, React.ReactNode> = {
  spark:     <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
  check:     <path d="M4 12l5 5L20 6"/>,
  plus:      <><path d="M12 5v14M5 12h14"/></>,
  x:         <><path d="M6 6l12 12M18 6L6 18"/></>,
  chev:      <path d="M9 6l6 6-6 6"/>,
  chevD:     <path d="M6 9l6 6 6-6"/>,
  copy:      <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  gear:      <><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
  download:  <><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></>,
  filter:    <path d="M3 5h18M6 12h12M10 19h4"/>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></>,
  user:      <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></>,
  link:      <><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
  zap:       <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>,
  tag:       <><path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/></>,
  clock:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  dot:       <circle cx="12" cy="12" r="4"/>,
  moon:      <path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10z"/>,
  sun:       <><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></>,
  grid:      <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  globe:     <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></>,
  mail:      <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>,
  pin:       <><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></>,
  trash:     <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></>,
  sliders:   <><path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h14M18 17h2"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="17" r="2"/></>,
  build:     <><path d="M3 12l9-9 9 9M5 10v10h14V10"/></>,
};

export function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.5, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
