import { toast } from "sonner";

export async function exportChartAsPNG(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
  if (!ref.current) return;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(ref.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Gráfico exportado como PNG");
  } catch {
    toast.error("Erro ao exportar gráfico");
  }
}
