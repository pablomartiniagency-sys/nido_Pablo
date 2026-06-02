import Link from "next/link";
import Image from "next/image";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 group">
      <Image src="/logo-nido.png" alt="Nido" width={40} height={40} className="rounded-xl shrink-0" />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold text-ink-900 tracking-tight">Delega</span>
        <span className="text-[10px] text-ink-400 font-medium">Nido by Delega</span>
      </div>
    </Link>
  );
}
