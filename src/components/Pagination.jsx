const GROUP_SIZE = 5

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const groupStart = Math.floor((currentPage - 1) / GROUP_SIZE) * GROUP_SIZE + 1
  const groupEnd = Math.min(groupStart + GROUP_SIZE - 1, totalPages)
  const pages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i)

  const hasPrevGroup = groupStart > 1
  const hasNextGroup = groupEnd < totalPages

  const navBtn = 'min-w-[28px] h-7 px-1 rounded-full text-xs font-semibold flex items-center justify-center transition-colors border border-gray-200 bg-white text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed'
  const pageBtn = 'min-w-[28px] h-7 px-1 rounded-full text-xs font-semibold flex items-center justify-center transition-colors'

  return (
    <div className="flex items-center justify-center gap-1.5 py-6">
      <button
        type="button"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="맨 앞 페이지로"
        className={navBtn}
      >
        &laquo;
      </button>
      <button
        type="button"
        onClick={() => onPageChange(groupStart - GROUP_SIZE)}
        disabled={!hasPrevGroup}
        aria-label="이전 그룹 첫 페이지로"
        className={navBtn}
      >
        &lsaquo;
      </button>

      {pages.map(p => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-label={`${p}페이지로`}
          aria-current={p === currentPage ? 'page' : undefined}
          className={`${pageBtn} ${
            p === currentPage
              ? 'bg-primary-500 text-white'
              : 'border border-gray-200 bg-white text-gray-600'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(groupStart + GROUP_SIZE)}
        disabled={!hasNextGroup}
        aria-label="다음 그룹 첫 페이지로"
        className={navBtn}
      >
        &rsaquo;
      </button>
      <button
        type="button"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="맨 뒤 페이지로"
        className={navBtn}
      >
        &raquo;
      </button>
    </div>
  )
}
