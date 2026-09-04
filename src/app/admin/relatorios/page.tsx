"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { useAuth } from "@/hooks/useAuth";
import { useRelatorioAdmin, type LinhaRelatorio } from "@/hooks/useRelatorioAdmin";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { formatarDataBR, formatarMinutos } from "@/lib/formatadores";

function nomeMes(anoMes: string) {
  return new Date(`${anoMes}-01T12:00:00`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function aplicarEstiloCabecalho(linha: ExcelJS.Row) {
  linha.font = { bold: true, color: { argb: "FFFFFFFF" } };
  linha.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF183B56" } };
  linha.alignment = { vertical: "middle" };
}

async function baixarExcel(linhas: LinhaRelatorio[], anoMes: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Ponto Eletrônico";
  workbook.created = new Date();

  const resumo = workbook.addWorksheet("Resumo");
  resumo.columns = [
    { header: "Funcionário", key: "funcionario", width: 30 },
    { header: "Matrícula", key: "matricula", width: 16 },
    { header: "Dias registrados", key: "dias", width: 18 },
    { header: "Dias incompletos", key: "incompletos", width: 18 },
    { header: "Horas trabalhadas", key: "trabalhadas", width: 20 },
    { header: "Atrasos", key: "atrasos", width: 16 },
    { header: "Horas extras", key: "extras", width: 18 },
  ];
  aplicarEstiloCabecalho(resumo.getRow(1));
  for (const linha of linhas) {
    resumo.addRow({
      funcionario: linha.usuario.nome,
      matricula: linha.usuario.matricula,
      dias: linha.diasComRegistro,
      incompletos: linha.diasIncompletos,
      trabalhadas: formatarMinutos(linha.minutosTrabalhados),
      atrasos: formatarMinutos(linha.minutosAtraso),
      extras: formatarMinutos(linha.minutosHoraExtra),
    });
  }
  resumo.autoFilter = { from: "A1", to: "G1" };
  resumo.views = [{ state: "frozen", ySplit: 1 }];

  const detalhamento = workbook.addWorksheet("Detalhamento diário");
  detalhamento.columns = [
    { header: "Funcionário", key: "funcionario", width: 30 },
    { header: "Matrícula", key: "matricula", width: 16 },
    { header: "Data", key: "data", width: 14 },
    { header: "Entrada", key: "entrada", width: 12 },
    { header: "Saída almoço", key: "saidaAlmoco", width: 16 },
    { header: "Retorno almoço", key: "retornoAlmoco", width: 18 },
    { header: "Saída", key: "saida", width: 12 },
    { header: "Total", key: "total", width: 14 },
    { header: "Atraso", key: "atraso", width: 14 },
    { header: "Hora extra", key: "extra", width: 16 },
    { header: "Localização", key: "localizacao", width: 16 },
    { header: "Distância (m)", key: "distancia", width: 16 },
    { header: "Precisão (m)", key: "precisao", width: 16 },
    { header: "Status", key: "status", width: 16 },
  ];
  aplicarEstiloCabecalho(detalhamento.getRow(1));
  for (const linha of linhas) {
    for (const dia of linha.dias) {
      detalhamento.addRow({
        funcionario: linha.usuario.nome,
        matricula: linha.usuario.matricula,
        data: formatarDataBR(dia.data, true),
        entrada: dia.entrada?.dataHora?.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) ?? "--:--",
        saidaAlmoco: dia.saidaAlmoco?.dataHora?.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) ?? "--:--",
        retornoAlmoco: dia.retornoAlmoco?.dataHora?.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) ?? "--:--",
        saida: dia.saida?.dataHora?.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) ?? "--:--",
        total: formatarMinutos(dia.minutosTrabalhados),
        atraso: formatarMinutos(dia.minutosAtraso),
        extra: formatarMinutos(dia.minutosHoraExtra),
        status: dia.incompleta ? "Incompleto" : "Normal",
        localizacao: dia.entrada?.geolocalizacaoValidada ? "Validada" : "Não informada",
        distancia: dia.entrada?.distanciaMetros ?? "-",
        precisao: dia.entrada?.precisaoMetros ?? "-",
      });
    }
  }
  detalhamento.autoFilter = { from: "A1", to: "N1" };
  detalhamento.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-ponto-${anoMes}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function RelatoriosConteudo() {
  const { perfil } = useAuth();
  const { anoMesSelecionado, setAnoMesSelecionado, linhas, carregando, erro } = useRelatorioAdmin();
  const [filtroNome, setFiltroNome] = useState("");
  const [exportando, setExportando] = useState(false);

  const linhasFiltradas = useMemo(
    () => linhas.filter((linha) => linha.usuario.nome.toLocaleLowerCase().includes(filtroNome.toLocaleLowerCase())),
    [filtroNome, linhas]
  );

  const totalizadores = useMemo(() => ({
    dias: linhasFiltradas.reduce((total, linha) => total + linha.diasComRegistro, 0),
    trabalhadas: linhasFiltradas.reduce((total, linha) => total + linha.minutosTrabalhados, 0),
    atrasos: linhasFiltradas.reduce((total, linha) => total + linha.minutosAtraso, 0),
    extras: linhasFiltradas.reduce((total, linha) => total + linha.minutosHoraExtra, 0),
  }), [linhasFiltradas]);

  async function exportar() {
    setExportando(true);
    try {
      await baixarExcel(linhasFiltradas, anoMesSelecionado);
    } finally {
      setExportando(false);
    }
  }

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader usuario={perfil} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">Relatórios</h1>
            <p className="font-body text-sm text-ink-600">Acompanhe a jornada mensal e exporte os dados para Excel.</p>
          </div>
          <Button type="button" onClick={exportar} carregando={exportando} disabled={carregando || linhasFiltradas.length === 0}>
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>

        {erro && <div role="alert" className="mb-6 flex items-center gap-2 rounded-card border border-red-600/20 bg-red-100 px-4 py-3 font-body text-sm text-red-600"><AlertTriangle className="h-4 w-4 shrink-0" />{erro}</div>}

        <section className="mb-6 grid grid-cols-1 gap-3 rounded-card border border-surface-border bg-white p-4 sm:grid-cols-[180px_1fr]">
          <label className="font-body text-sm font-medium text-ink-700">
            Mês do relatório
            <input type="month" value={anoMesSelecionado} onChange={(evento) => setAnoMesSelecionado(evento.target.value)} className="mt-1 block w-full rounded-card border border-surface-border px-3 py-2 font-body text-sm text-ink-900 focus:border-teal-600 focus:outline-none" />
          </label>
          <label className="font-body text-sm font-medium text-ink-700">
            Buscar funcionário
            <input type="search" value={filtroNome} onChange={(evento) => setFiltroNome(evento.target.value)} placeholder="Nome do funcionário" className="mt-1 block w-full rounded-card border border-surface-border px-3 py-2 font-body text-sm text-ink-900 focus:border-teal-600 focus:outline-none" />
          </label>
        </section>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[["Funcionários", linhasFiltradas.length], ["Dias registrados", totalizadores.dias], ["Horas trabalhadas", formatarMinutos(totalizadores.trabalhadas)], ["Atrasos", formatarMinutos(totalizadores.atrasos)]].map(([rotulo, valor]) => (
            <div key={String(rotulo)} className="rounded-card border border-surface-border bg-white p-4"><p className="font-body text-xs uppercase tracking-wide text-ink-400">{rotulo}</p><p className="mt-2 font-display text-xl font-semibold text-navy-800">{valor}</p></div>
          ))}
        </div>

        {carregando ? <div className="rounded-card border border-surface-border bg-white p-10 text-center font-body text-sm text-ink-400">Carregando relatório...</div> : linhasFiltradas.length === 0 ? <div className="rounded-card border border-surface-border bg-white p-10 text-center"><FileSpreadsheet className="mx-auto mb-3 h-8 w-8 text-ink-400" /><p className="font-body text-sm text-ink-600">Nenhum funcionário encontrado neste filtro.</p></div> : <div className="overflow-x-auto rounded-card border border-surface-border bg-white"><table className="w-full min-w-[820px] border-collapse font-body text-sm"><thead><tr className="border-b border-surface-border text-left text-xs font-semibold uppercase tracking-wide text-ink-400"><th className="px-4 py-3">Funcionário</th><th className="px-4 py-3">Matrícula</th><th className="px-4 py-3">Dias</th><th className="px-4 py-3">Incompletos</th><th className="px-4 py-3">Trabalhadas</th><th className="px-4 py-3">Atrasos</th><th className="px-4 py-3">Extras</th></tr></thead><tbody>{linhasFiltradas.map((linha) => <tr key={linha.usuario.uid} className="border-b border-surface-border last:border-0"><td className="px-4 py-3 font-medium text-ink-900">{linha.usuario.nome}</td><td className="px-4 py-3 text-ink-600">{linha.usuario.matricula}</td><td className="px-4 py-3 tabular-nums text-ink-600">{linha.diasComRegistro}</td><td className="px-4 py-3 tabular-nums text-ink-600">{linha.diasIncompletos}</td><td className="px-4 py-3 font-mono tabular-nums text-navy-800">{formatarMinutos(linha.minutosTrabalhados)}</td><td className="px-4 py-3 font-mono tabular-nums text-ink-600">{formatarMinutos(linha.minutosAtraso)}</td><td className="px-4 py-3 font-mono tabular-nums text-ink-600">{formatarMinutos(linha.minutosHoraExtra)}</td></tr>)}</tbody></table></div>}
        <p className="mt-4 text-right font-body text-xs text-ink-400">Período: {nomeMes(anoMesSelecionado)} · {totalizadores.extras > 0 ? `${formatarMinutos(totalizadores.extras)} de horas extras` : "sem horas extras"}</p>
      </main>
    </div>
  );
}

export default function RelatoriosPage() {
  return <ProtectedRoute perfisPermitidos={["admin", "gestor"]}><RelatoriosConteudo /></ProtectedRoute>;
}
