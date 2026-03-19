import { useEffect, useState } from "react";

type SmartImageProps = Omit<JSX.IntrinsicElements["img"], "src" | "loading" | "decoding" | "fetchPriority"> & {
  src?: string | null;
  fallbackSrc?: string;
  priority?: boolean;
};

export default function SmartImage({
  src,
  fallbackSrc = "/placeholder.svg",
  priority = false,
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
      {...({ fetchpriority: priority ? "high" : "auto" } as Record<string, string>)}
      src={currentSrc}
      loading={priority ? "eager" : props.loading ?? "lazy"}
      decoding="async"
      onError={(event) => {
        props.onError?.(event);
        handleError();
      }}
    />
  );
}
