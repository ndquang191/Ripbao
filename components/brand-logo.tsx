import Image from "next/image";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "size-9" }: BrandLogoProps) {
  return (
    <Image
      src="/icon.svg"
      alt=""
      aria-hidden="true"
      width={36}
      height={36}
      className={`block shrink-0 ${className}`}
    />
  );
}
