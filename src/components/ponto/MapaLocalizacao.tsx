"use client";

import { Circle, CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { Coordenadas } from "@/lib/geolocalizacao";

function AjustarMapa({ usuario, trabalho }: { usuario: Coordenadas; trabalho: Coordenadas }) {
  const mapa = useMap();
  useEffect(() => {
    mapa.fitBounds([ [usuario.latitude, usuario.longitude], [trabalho.latitude, trabalho.longitude] ], { padding: [24, 24] });
  }, [mapa, usuario, trabalho]);
  return null;
}

export function MapaLocalizacao({ usuario, trabalho, raioMetros, valida }: { usuario: Coordenadas; trabalho: Coordenadas; raioMetros: number; valida: boolean }) {
  return (
    <MapContainer center={[trabalho.latitude, trabalho.longitude]} zoom={17} scrollWheelZoom={false} className="relative z-0 isolate h-64 w-full rounded-card">
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Circle center={[trabalho.latitude, trabalho.longitude]} radius={raioMetros} pathOptions={{ color: valida ? "#15803d" : "#dc2626", fillOpacity: 0.12 }} />
      <CircleMarker center={[trabalho.latitude, trabalho.longitude]} radius={9} pathOptions={{ color: "#183B56", fillColor: "#183B56", fillOpacity: 1 }} />
      <CircleMarker center={[usuario.latitude, usuario.longitude]} radius={8} pathOptions={{ color: valida ? "#15803d" : "#dc2626", fillColor: valida ? "#22c55e" : "#ef4444", fillOpacity: 1 }} />
      <AjustarMapa usuario={usuario} trabalho={trabalho} />
    </MapContainer>
  );
}