import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { rotuloBotaoParaTipo } from "@/lib/validacaoSequencia";
import type { TipoRegistro } from "@/types/registroPonto";

interface BotaoRegistroProps {
  proximoTipo: TipoRegistro | null;
  diaNaoTrabalhado?: boolean;
  registrando: boolean;
  onRegistrar: () => void;
}

export function BotaoRegistro({ proximoTipo, diaNaoTrabalhado, registrando, onRegistrar }: BotaoRegistroProps) {
  if (diaNaoTrabalhado) {
    return (
      <div className="rounded-card border border-surface-border bg-white px-6 py-8 text-center">
        <p className="font-display text-base font-semibold text-ink-900">Dia sem expediente</p>
        <p className="font-body text-sm text-ink-600">A jornada não prevê registros para hoje.</p>
      </div>
    );
  }

  if (!proximoTipo) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-green-600/20 bg-green-100 px-6 py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
        <p className="font-display text-base font-semibold text-green-600">
          Jornada concluída
        </p>
        <p className="font-body text-sm text-ink-600">
          Todos os registros de hoje foram feitos. Até amanhã!
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={onRegistrar}
      carregando={registrando}
      className="w-full py-6 text-base"
    >
      {registrando ? "Registrando…" : rotuloBotaoParaTipo(proximoTipo)}
    </Button>
  );
}
