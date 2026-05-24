import Link from "next/link";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 group">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lapis-400 to-lapis-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-lapis-500/20">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <path d="M12 3L4 9v12h16V9L12 3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M8 21v-8h8v8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
      <div>
        <div className="wordmark text-base leading-none">nido</div>
        <div className="text-[9px] font-medium tracking-[0.15em] uppercase text-lapis-400">by delega</div>
      </div>
    </Link>
  );
}
