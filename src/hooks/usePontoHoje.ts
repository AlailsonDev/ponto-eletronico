"use client";

import { useEffect, useState, useCallback } from "react";
import type { Usuario } from "@/types/usuario";
import { diasTrabalhoDaJornada, type Jornada } from "@/types/jornada";
import type { RegistroPonto } from "@/types/registroPonto";
import { observarRegistrosDoDia, registrarPonto, traduzirErroPonto } from "@/services/ponto.service";
import { buscarJornada } from "@/services/jornadas.service";
import { calcularResumoDia } from "@/lib/calculoJornada";
import { proximoTipoPermitido } from "@/lib/validacaoSequencia";
import { dataHojeISO } from "@/lib/formatadores";

export function usePontoHoje(usuario: Usuario | null) {
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const hoje = dataHojeISO();
  const diaDaSemana = new Date(`${hoje}T12:00:00`).getDay();
  const diaNaoTrabalhado = !!jornada && !diasTrabalhoDaJornada(jornada).includes(diaDaSemana);

  // Listener único dos registros de hoje — dispara de novo só se o uid mudar.
  useEffect(() => {
    if (!usuario) return;

    setCarregando(true);
    const unsubscribe = observarRegistrosDoDia(
      usuario.uid,
      hoje,
      (novos) => {
        setRegistros(novos);
        setCarregando(false);
      },
      () => {
        setErro("Não foi possível carregar seus registros de hoje.");
        setCarregando(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.uid, hoje]);

  // Jornada é buscada uma única vez (não muda em tempo real durante o dia).
  useEffect(() => {
    if (!usuario?.jornadaId) return;
    buscarJornada(usuario.jornadaId).then(setJornada).catch(() => setJornada(null));
  }, [usuario?.jornadaId]);

  const registrar = useCallback(async () => {
    if (!usuario) return;
    if (diaNaoTrabalhado) return;
    const proximoTipo = proximoTipoPermitido(registros);
    if (!proximoTipo) return;

    setErro(null);
    setRegistrando(true);
    try {
      await registrarPonto(usuario, hoje, proximoTipo);
      // Não precisamos atualizar o estado manualmente: o onSnapshot já
      // vai receber o novo documento e re-renderizar.
    } catch (err) {
      const codigo = (err as { code?: string })?.code ?? "";
      setErro(traduzirErroPonto(codigo));
    } finally {
      setRegistrando(false);
    }
  }, [usuario, registros, hoje, diaNaoTrabalhado]);

  const resumo = calcularResumoDia(hoje, registros, jornada);
  const proximoTipo = diaNaoTrabalhado ? null : proximoTipoPermitido(registros);

  return { resumo, proximoTipo, diaNaoTrabalhado, registrar, registrando, carregando, erro, limparErro: () => setErro(null) };
}
