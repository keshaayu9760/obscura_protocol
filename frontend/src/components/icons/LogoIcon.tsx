export default function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="16" fill="#16110E" />
      <rect x="1" y="1" width="46" height="46" rx="15" stroke="url(#frame)" strokeWidth="1.2" />
      <path
        d="M24 10C31.038 10 37.046 15.104 40 24C37.046 32.896 31.038 38 24 38C16.962 38 10.954 32.896 8 24C10.954 15.104 16.962 10 24 10Z"
        fill="url(#shell)"
        stroke="url(#edge)"
        strokeWidth="1.6"
      />
      <path d="M24 6V14" stroke="#E3A65D" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24 34V42" stroke="#88BE9F" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 24H14" stroke="#B78452" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M34 24H42" stroke="#B78452" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="24" r="6.5" fill="#EED9B9" />
      <circle cx="24" cy="24" r="2.7" fill="#16110E" />
      <defs>
        <linearGradient id="frame" x1="5" y1="5" x2="43" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E3A65D" stopOpacity="0.8" />
          <stop offset="1" stopColor="#88BE9F" stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id="shell" x1="13" y1="12" x2="35" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#241B16" />
          <stop offset="1" stopColor="#332720" />
        </linearGradient>
        <linearGradient id="edge" x1="11" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E3A65D" />
          <stop offset="1" stopColor="#88BE9F" />
        </linearGradient>
      </defs>
    </svg>
  );
}
