export const RAIO_PADRAO_METROS = 100;
export const PRECISAO_MAXIMA_METROS = 100;

export type MetodoGeolocalizacao =
  | "GEOLOCATION"
  | "GEOLOCATION_FORA_DO_RAIO"
  | "GEOLOCATION_PRECISAO_BAIXA"
  | "NO_GEOLOCATION_DESKTOP";

export function dispositivoMovel(userAgent: string, plataforma = "", pontosDeToque = 0): boolean {
  return /Android|iPhone|iPad|iPod|Windows Phone|Mobile|Tablet|Kindle|Silk/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && plataforma === "MacIntel" && pontosDeToque > 1);
}

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export function coordenadasValidas({ latitude, longitude }: Coordenadas): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

export function distanciaEmMetros(origem: Coordenadas, destino: Coordenadas): number {
  const raioTerra = 6_371_000;
  const latitudeOrigem = origem.latitude * Math.PI / 180;
  const latitudeDestino = destino.latitude * Math.PI / 180;
  const diferencaLatitude = (destino.latitude - origem.latitude) * Math.PI / 180;
  const diferencaLongitude = (destino.longitude - origem.longitude) * Math.PI / 180;
  const haversine = Math.sin(diferencaLatitude / 2) ** 2 +
    Math.cos(latitudeOrigem) * Math.cos(latitudeDestino) * Math.sin(diferencaLongitude / 2) ** 2;
  return 2 * raioTerra * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}