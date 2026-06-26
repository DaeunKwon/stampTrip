export default function BenefitCard({ benefit }) {
  const { title, addr1, firstimage, tel, cat3 } = benefit

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {firstimage ? (
        <img src={firstimage} alt={title} className="w-full h-36 object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-36 bg-primary-50 flex items-center justify-center">
          <span className="text-4xl">🎁</span>
        </div>
      )}
      <div className="p-3 flex-1 flex flex-col">
        <span className="inline-block self-start px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full mb-1.5">
          {cat3 || '혜택'}
        </span>
        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 flex-1">{title}</h3>
        {addr1 && <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{addr1}</p>}
        {tel && <p className="text-xs text-gray-400 mt-0.5">{tel}</p>}
      </div>
    </div>
  )
}
