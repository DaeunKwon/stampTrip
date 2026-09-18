/** 앱 아이콘(코발트 바탕 + 흰 핀)을 그대로 옮긴 SVG. 크기는 className 으로 정한다. */
export default function AppIcon({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="512" height="512" rx="115" fill="#2f5fe0" />
      <g transform="translate(65.8,56.3) scale(15.85)">
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        />
      </g>
    </svg>
  )
}
