import { Star } from "lucide-react";
import { useState } from "react";

interface Props {
  value?: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function RatingStars({ value = 0, onChange, readonly = false, size = 20 }: Props) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
          >
            <Star
              size={size}
              className={filled ? "fill-primary text-primary" : "text-muted-foreground/40"}
            />
          </button>
        );
      })}
    </div>
  );
}
