import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { rotuloBotaoParaTipo } from "@/lib/validacaoSequencia";
import type { TipoRegistro } from "@/types/registroPonto";

interface BotaoRegistroProps {
  proximoTipo: TipoRegistro | null;
  registrando: boolean;
  onRegistrar: () => void;
}

export function BotaoRegistro({ proximoTipo, registrando, onRegistrar }: BotaoRegistroProps) {
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
