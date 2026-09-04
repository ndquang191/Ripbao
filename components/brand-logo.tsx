type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "size-9" }: BrandLogoProps) {
  return <img src="/icon.svg" alt="" aria-hidden="true" className={`block shrink-0 ${className}`} />;
}
