import Link from "next/link";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group">
      <div className="w-8 h-8 rounded-xl bg-coral-500/20 border border-coral-500/30 flex items-center justify-center text-coral-400 font-extrabold text-sm">
        N
      </div>
      <div>
        <div className="wordmark text-base leading-none">nido</div>
        <div className="text-[9px] font-medium tracking-[0.15em] uppercase text-white/30">by delega</div>
      </div>
    </Link>
  );
}
