import { NextRequest, NextResponse, userAgent } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb, verificarTokenAtivo } from "@/lib/firebase/admin";
import { coordenadasValidas, dispositivoMovel, distanciaEmMetros, RAIO_PADRAO_METROS, PRECISAO_MAXIMA_METROS } from "@/lib/geolocalizacao";
import type { TipoRegistro } from "@/types/registroPonto";

const TIPOS: TipoRegistro[] = ["ENTRADA", "SAIDA_ALMOCO", "RETORNO_ALMOCO", "SAIDA"];
const ANTES_DE: Partial<Record<TipoRegistro, TipoRegistro>> = {
  SAIDA_ALMOCO: "ENTRADA",
  RETORNO_ALMOCO: "SAIDA_ALMOCO",
  SAIDA: "RETORNO_ALMOCO",
};

interface RegistroInput {
  data?: string;
  tipo?: TipoRegistro;
  latitude?: number;
  longitude?: number;
  precisaoMetros?: number;
}

function dataLocalHoje(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife" }).format(new Date());
}

function idRegistro(usuarioId: string, data: string, tipo: TipoRegistro) {
  return `${usuarioId}_${data}_${tipo}`;
}

export async function POST(request: NextRequest) {
  try {
    const header = request.headers.get("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

    const { uid, usuario } = await verificarTokenAtivo(token);
    const tipoDispositivo = userAgent(request).device.type;
    const userAgentHeader = request.headers.get("user-agent") ?? "";
    const localizacaoObrigatoria = tipoDispositivo === "mobile" || tipoDispositivo === "tablet" ||
      (!tipoDispositivo && dispositivoMovel(userAgentHeader));
    const body = (await request.json()) as RegistroInput;
    if (!body.data || body.data !== dataLocalHoje() || !body.tipo || !TIPOS.includes(body.tipo)) {
      return NextResponse.json({ erro: "Dados do registro inválidos.", codigo: "DADOS_INVALIDOS" }, { status: 400 });
    }
    const informouLatitude = body.latitude !== undefined;
    const informouLongitude = body.longitude !== undefined;
    const informouPrecisao = body.precisaoMetros !== undefined;
    const informouLocalizacao = informouLatitude || informouLongitude || informouPrecisao;
    const setorSnapshot = await adminDb.collection("setores").doc(usuario?.setorId).get();
    const dadosSetor = setorSnapshot.data();
    if (!setorSnapshot.exists || dadosSetor?.ativo !== true) {
      return NextResponse.json({ erro: "O setor do usuário não está ativo.", codigo: "SETOR_INATIVO" }, { status: 400 });
    }
    if (localizacaoObrigatoria && (!informouLatitude || !informouLongitude || !informouPrecisao)) {
      return NextResponse.json({ erro: "Não foi possível verificar sua localização. Permita o acesso à localização para registrar o ponto.", codigo: "LOCALIZACAO_OBRIGATORIA" }, { status: 400 });
    }
    if (informouLocalizacao && (!informouLatitude || !informouLongitude || !informouPrecisao || !coordenadasValidas({ latitude: body.latitude!, longitude: body.longitude! }) || !Number.isFinite(body.precisaoMetros) || body.precisaoMetros! < 0)) {
      return NextResponse.json({ erro: "Localização inválida.", codigo: "LOCALIZACAO_INVALIDA" }, { status: 400 });
    }
    if (localizacaoObrigatoria && body.precisaoMetros! > PRECISAO_MAXIMA_METROS) {
      return NextResponse.json({ erro: "A localização não tem precisão suficiente.", codigo: "PRECISAO_BAIXA" }, { status: 400 });
    }

    let setor: { [campo: string]: unknown } | undefined;
    let distanciaMetros: number | undefined;
    let localizacaoValidada = false;
    let metodoGeolocalizacao: "GEOLOCATION" | "GEOLOCATION_FORA_DO_RAIO" | "GEOLOCATION_PRECISAO_BAIXA" | "NO_GEOLOCATION_DESKTOP" = "NO_GEOLOCATION_DESKTOP";
    if (informouLocalizacao) {
      metodoGeolocalizacao = "GEOLOCATION";
      setor = dadosSetor;
      const setorConfigurado = setorSnapshot.exists && dadosSetor?.ativo === true && Number.isFinite(dadosSetor.latitude) && Number.isFinite(dadosSetor.longitude) && coordenadasValidas({ latitude: dadosSetor.latitude, longitude: dadosSetor.longitude });
      if (localizacaoObrigatoria && !setorConfigurado) {
        return NextResponse.json({ erro: "O local de trabalho ainda não foi configurado.", codigo: "LOCAL_NAO_CONFIGURADO" }, { status: 400 });
      }
      if (setorConfigurado && dadosSetor) {
        const raioMetros = Number.isFinite(dadosSetor.raioMetros) && dadosSetor.raioMetros > 0 ? Math.min(dadosSetor.raioMetros, 1_000) : RAIO_PADRAO_METROS;
        distanciaMetros = distanciaEmMetros(
          { latitude: body.latitude!, longitude: body.longitude! },
          { latitude: dadosSetor.latitude, longitude: dadosSetor.longitude }
        );
        if (localizacaoObrigatoria && distanciaMetros > raioMetros) {
          return NextResponse.json({ erro: `Você está fora da área permitida. Distância aproximada: ${Math.round(distanciaMetros)} metros.`, codigo: "FORA_DO_RAIO", distanciaMetros: Math.round(distanciaMetros) }, { status: 403 });
        }
        localizacaoValidada = body.precisaoMetros! <= PRECISAO_MAXIMA_METROS && distanciaMetros <= raioMetros;
        metodoGeolocalizacao = localizacaoValidada ? "GEOLOCATION" : body.precisaoMetros! > PRECISAO_MAXIMA_METROS ? "GEOLOCATION_PRECISAO_BAIXA" : "GEOLOCATION_FORA_DO_RAIO";
      }
    }

    const registroRef = adminDb.collection("registros_ponto").doc(idRegistro(uid, body.data, body.tipo));
    await adminDb.runTransaction(async (transaction) => {
      const registroSnapshot = await transaction.get(registroRef);
      if (registroSnapshot.exists) throw new Error("REGISTRO_JA_EXISTE");
      const tipoAnterior = ANTES_DE[body.tipo!];
      if (tipoAnterior) {
        const anterior = await transaction.get(adminDb.collection("registros_ponto").doc(idRegistro(uid, body.data!, tipoAnterior)));
        if (!anterior.exists) throw new Error("SEQUENCIA_INVALIDA");
      }
      const dadosRegistro: Record<string, unknown> = {
        usuarioId: uid,
        setorId: usuario?.setorId,
        tipo: body.tipo,
        data: body.data,
        dataHora: FieldValue.serverTimestamp(),
        origem: "web",
        editadoPorCorrecao: false,
        metodoGeolocalizacao,
        criadoEm: Timestamp.now(),
      };
      if (informouLocalizacao) {
        dadosRegistro.latitude = body.latitude;
        dadosRegistro.longitude = body.longitude;
        dadosRegistro.precisaoMetros = body.precisaoMetros;
        if (distanciaMetros !== undefined) dadosRegistro.distanciaMetros = Math.round(distanciaMetros);
        if (setor) dadosRegistro.localTrabalhoId = usuario?.setorId;
        dadosRegistro.geolocalizacaoValidada = localizacaoValidada;
      }
      transaction.create(registroRef, dadosRegistro);
    });
    return NextResponse.json({ ok: true, ...(distanciaMetros !== undefined ? { distanciaMetros: Math.round(distanciaMetros) } : {}) }, { status: 201 });
  } catch (erro) {
    const codigo = (erro as Error).message;
    if (codigo === "REGISTRO_JA_EXISTE") return NextResponse.json({ erro: "Este ponto já foi registrado.", codigo }, { status: 409 });
    if (codigo === "SEQUENCIA_INVALIDA") return NextResponse.json({ erro: "A sequência de registros não é válida.", codigo }, { status: 400 });
    const mensagem = codigo ?? "";
    if (mensagem.includes("inativo") || mensagem.includes("não encontrado") || mensagem.includes("não verificado")) return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    return NextResponse.json({ erro: "Não foi possível registrar o ponto." }, { status: 500 });
  }
}