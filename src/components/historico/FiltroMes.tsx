import { ChevronLeft, ChevronRight } from "lucide-react";

interface FiltroMesProps {
  anoMesSelecionado: string; // "YYYY-MM"
  onChange: (novoAnoMes: string) => void;
}

function deslocarMes(anoMes: string, delta: number): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  const data = new Date(ano, mes - 1 + delta, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function rotuloMes(anoMes: string): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  const data = new Date(ano, mes - 1, 1);
  const texto = data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function FiltroMes({ anoMesSelecionado, onChange }: FiltroMesProps) {
  return (
    <div className="flex items-center gap-1 rounded-card border border-surface-border bg-white px-2 py-1.5">
      <button
        onClick={() => onChange(deslocarMes(anoMesSelecionado, -1))}
        aria-label="Mês anterior"
        className="flex h-8 w-8 items-center justify-center rounded-card text-ink-600 hover:bg-surface"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="min-w-[160px] text-center font-body text-sm font-medium text-ink-900">
        {rotuloMes(anoMesSelecionado)}
      </span>

      <button
        onClick={() => onChange(deslocarMes(anoMesSelecionado, 1))}
        aria-label="Próximo mês"
        className="flex h-8 w-8 items-center justify-center rounded-card text-ink-600 hover:bg-surface"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
