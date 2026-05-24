import Link from "next/link";
import Image from "next/image";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 group">
      <Image src="/logo-nido.png" alt="Nido" width={36} height={36} className="rounded-xl" />
      <div>
        <Image src="/delega_logo.png" alt="Delega" width={60} height={20} className="h-5 w-auto" />
      </div>
    </Link>
  );
}
