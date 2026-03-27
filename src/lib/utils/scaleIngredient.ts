function formatQuantity(num: number): string {
  if (num % 1 === 0) return String(num);
  const whole = Math.floor(num);
  const fraction = num - whole;

  let fStr = "";
  if (Math.abs(fraction - 0.25) < 0.01) fStr = "1/4";
  else if (Math.abs(fraction - 0.33) < 0.02) fStr = "1/3";
  else if (Math.abs(fraction - 0.5) < 0.01) fStr = "1/2";
  else if (Math.abs(fraction - 0.66) < 0.02) fStr = "2/3";
  else if (Math.abs(fraction - 0.75) < 0.01) fStr = "3/4";

  if (fStr) {
    return whole > 0 ? `${whole} e ${fStr}` : fStr;
  }

  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(num);
}

export function scaleIngredient(text: string, baseServings: number, customServings: number) {
  const factor = customServings / baseServings;
  if (factor === 1) return text;

  const regex = /^(?:(\d+)\s+(?:e\s+)?(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)|(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?))/i;
  const match = text.match(regex);
  if (!match) return text;

  const numberPart = match[0];
  const rest = text.substring(numberPart.length);

  let value = 0;
  // Handle "1 e 1/2" or "1 1/2" or "1.5"
  const parts = numberPart.toLowerCase().split(/\s+e\s+|\s+/).filter(Boolean);

  parts.forEach((part) => {
    if (part.includes("/")) {
      const [num, den] = part.split("/");
      value += parseFloat(num) / parseFloat(den);
    } else {
      value += parseFloat(part.replace(",", "."));
    }
  });

  if (Number.isNaN(value) || value <= 0) return text;

  return `${formatQuantity(value * factor)}${rest}`;
}
