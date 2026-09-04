"use client";

import { useCallback, useEffect, useState } from "react";
import { coordenadasValidas, distanciaEmMetros, dispositivoMovel, PRECISAO_MAXIMA_METROS, RAIO_PADRAO_METROS } from "@/lib/geolocalizacao";
import type { Setor } from "@/types/setor";

export type StatusGeolocalizacao = "inicial" | "obtendo" | "valida" | "fora-do-raio" | "erro";

export function useGeolocalizacao(setor: Setor | null) {
  const obrigatoria = typeof navigator !== "undefined" && dispositivoMovel(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
  const [status, setStatus] = useState<StatusGeolocalizacao>("inicial");
  const [posicao, setPosicao] = useState<GeolocationCoordinates | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const solicitar = useCallback(() => {
    if (!navigator.geolocation) {
      setPosicao(null);
      setStatus("erro");
      setErro(obrigatoria ? "Este dispositivo não permite verificar sua localização." : null);
      return;
    }
    if (!setor || !coordenadasValidas({ latitude: setor.latitude ?? NaN, longitude: setor.longitude ?? NaN })) {
      setPosicao(null);
      setStatus("erro");
      setErro(obrigatoria ? "O local de trabalho ainda não foi configurado." : null);
      return;
    }
    setStatus("obtendo");
    setErro(null);
    setPosicao(null);
    navigator.geolocation.getCurrentPosition(
      (resultado) => {
          if (!coordenadasValidas({ latitude: resultado.coords.latitude, longitude: resultado.coords.longitude })) {
            setStatus("erro");
            setErro(obrigatoria ? "Não foi possível obter uma localização válida. Tente novamente." : null);
            return;
          }
        setPosicao(resultado.coords);
        if (resultado.coords.accuracy > PRECISAO_MAXIMA_METROS) {
          setStatus("erro");
          setErro(obrigatoria ? "Não foi possível determinar sua localização com precisão suficiente. Tente novamente em um local com melhor sinal de GPS." : null);
          return;
        }
        const distancia = distanciaEmMetros(
          { latitude: resultado.coords.latitude, longitude: resultado.coords.longitude },
          { latitude: setor.latitude!, longitude: setor.longitude! }
        );
        if (distancia <= (setor.raioMetros ?? RAIO_PADRAO_METROS)) setStatus("valida");
        else setStatus("fora-do-raio");
      },
      (resultado) => {
        setPosicao(null);
        setStatus("erro");
        if (!obrigatoria) {
          setErro(null);
        } else if (resultado.code === resultado.PERMISSION_DENIED) {
          setErro("Não foi possível verificar sua localização. Permita o acesso à localização para registrar o ponto.");
        } else if (resultado.code === resultado.TIMEOUT) {
          setErro("Não foi possível obter sua localização. Tente novamente.");
        } else {
          setErro("Não foi possível determinar sua localização.");
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  }, [obrigatoria, setor]);

  useEffect(() => { solicitar(); }, [solicitar]);

  const distancia = posicao && setor?.latitude !== undefined && setor.longitude !== undefined
    ? distanciaEmMetros({ latitude: posicao.latitude, longitude: posicao.longitude }, { latitude: setor.latitude, longitude: setor.longitude })
    : null;

  return { status, posicao, distancia, erro, solicitar, valida: status === "valida", obrigatoria };
}