"use client";

import { useEffect, useState } from "react";

/** Atualiza a cada segundo. Uso puramente informativo na UI — nunca é a
 * fonte de verdade para cálculo de jornada, que sempre usa serverTimestamp(). */
export function useRelogio() {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const intervalo = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  return agora;
}
