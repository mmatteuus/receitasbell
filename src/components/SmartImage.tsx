import { useEffect, useState } from "react";

type SmartImageProps = Omit<JSX.IntrinsicElements["img"], "src" | "decoding" | "fetchPriority"> & {
  src?: string | null;
  fallbackSrc?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
};

export default function SmartImage({
  src,
  fallbackSrc = "/placeholder.svg",
  priority = false,
  width,
  height,
  sizes,
  loading,
  ...props
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <img
      {...props}
      sizes={sizes}
      {...({ fetchpriority: priority ? "high" : "auto" } as Record<string, string>)}
      src={currentSrc}
      loading={priority ? "eager" : loading ?? "lazy"}
      decoding="async"
      width={width}
      height={height}
      onError={(event) => {
        props.onError?.(event);
        handleError();
      }}
    />
  );
}
