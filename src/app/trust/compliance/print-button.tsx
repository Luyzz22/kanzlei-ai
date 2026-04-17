"use client"

export function PrintButton() {
  return (
    <button
      onClick={() => {
        if (typeof window !== "undefined") window.print()
      }}
      className="inline-flex items-center gap-2 rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] print:hidden"
    >
      📄 Als PDF drucken
    </button>
  )
}
