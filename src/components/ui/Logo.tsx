import Link from "next/link";
import Image from "next/image";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 group">
      <Image src="/logo-nido.png" alt="Nido" width={40} height={40} className="rounded-xl" />
    </Link>
  );
}
