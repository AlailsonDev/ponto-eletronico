export interface Setor {
  id: string;
  nome: string;
  gestoresIds: string[];
  ativo: boolean;
  latitude?: number;
  longitude?: number;
  raioMetros?: number;
}
