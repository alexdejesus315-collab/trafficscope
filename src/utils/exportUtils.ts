import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { DomainMetrics } from '../types/domain';

export function exportToExcel(domains: DomainMetrics[], fileName: string = 'TrafficScope_Report.xlsx') {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = domains.map(d => ({
    'Domínio': d.domain,
    'Nome': d.name,
    'Categoria': d.category,
    'Visitas Mensais Estimadas': d.monthlyVisits.toLocaleString('pt-BR'),
    'Crescimento (%)': `${d.growthRate > 0 ? '+' : ''}${d.growthRate}%`,
    'Duração Média': d.avgVisitDuration,
    'Páginas por Visita': d.pagesPerVisit,
    'Taxa de Rejeição (%)': `${d.bounceRate}%`,
    'Última Atualização': d.lastUpdated
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumo Executivo');

  // Traffic Sources Sheet
  const trafficSourcesData: any[] = [];
  domains.forEach(d => {
    d.trafficSources.forEach(s => {
      trafficSourcesData.push({
        'Domínio': d.domain,
        'Canal de Tráfego': s.name,
        'Participação (%)': `${s.percentage}%`,
        'Visitas Estimadas': s.visits.toLocaleString('pt-BR')
      });
    });
  });
  const trafficSourcesSheet = XLSX.utils.json_to_sheet(trafficSourcesData);
  XLSX.utils.book_append_sheet(wb, trafficSourcesSheet, 'Fontes de Tráfego');

  // Country Traffic Sheet
  const countryData: any[] = [];
  domains.forEach(d => {
    d.countryTraffic.forEach(c => {
      countryData.push({
        'Domínio': d.domain,
        'País': c.name,
        'Código': c.code,
        'Participação (%)': `${c.percentage}%`,
        'Visitas Estimadas': c.visits.toLocaleString('pt-BR')
      });
    });
  });
  const countrySheet = XLSX.utils.json_to_sheet(countryData);
  XLSX.utils.book_append_sheet(wb, countrySheet, 'Origem Geográfica');

  // Write file
  XLSX.writeFile(wb, fileName);
}

export function exportToPdf(domain: DomainMetrics) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TrafficScope', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Inteligência Competitiva Web', 14, 25);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 25);

  // Domain Overview Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Análise de Domínio: ${domain.domain.toUpperCase()}`, 14, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Categoria: ${domain.category}`, 14, 52);
  doc.text(`Descrição: ${domain.description}`, 14, 58);

  // Key KPI Cards Simulation
  let y = 70;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 90, 28, 3, 3, 'F');
  doc.roundedRect(106, y, 90, 28, 3, 3, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('TRÁFEGO MENSAL', 18, y + 8);
  doc.text('CRESCIMENTO', 110, y + 8);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(domain.monthlyVisits.toLocaleString('pt-BR'), 18, y + 18);
  
  doc.setTextColor(domain.growthRate >= 0 ? 16 : 220, domain.growthRate >= 0 ? 185 : 38, domain.growthRate >= 0 ? 129 : 38);
  doc.text(`${domain.growthRate > 0 ? '+' : ''}${domain.growthRate}%`, 110, y + 18);

  // Additional Metrics Grid
  y += 38;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Métricas de Engajamento', 14, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`• Duração Média da Visita: ${domain.avgVisitDuration}`, 18, y + 4);
  doc.text(`• Páginas por Visita: ${domain.pagesPerVisit}`, 18, y + 10);
  doc.text(`• Taxa de Rejeição: ${domain.bounceRate}%`, 18, y + 16);

  // Traffic Channels Section
  y += 28;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Distribuição por Fontes de Tráfego', 14, y);

  y += 6;
  domain.trafficSources.forEach((src) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${src.name}:`, 18, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${src.percentage}% (${src.visits.toLocaleString('pt-BR')} visitas)`, 65, y + 4);

    // Progress bar line
    doc.setFillColor(226, 232, 240);
    doc.rect(130, y + 1, 65, 4, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(130, y + 1, (src.percentage / 100) * 65, 4, 'F');

    y += 8;
  });

  // Top Countries
  y += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Principais Origens Geográficas', 14, y);

  y += 6;
  domain.countryTraffic.slice(0, 5).forEach((c) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`${c.flag} ${c.name} (${c.code}): ${c.percentage}% - ${c.visits.toLocaleString('pt-BR')} visitas`, 18, y + 4);
    y += 6;
  });

  // AI Summary if available
  if (domain.aiReport?.summary) {
    y += 10;
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(14, y, 182, 35, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202);
    doc.text('Resumo Executivo Gerado por IA (TrafficScope Intelligence)', 18, y + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 27, 75);

    const splitText = doc.splitTextToSize(domain.aiReport.summary, 174);
    doc.text(splitText, 18, y + 15);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('TrafficScope AI Competitive Intelligence • Documento Gerado Automaticamente', 14, 285);

  doc.save(`TrafficScope_${domain.domain}_Report.pdf`);
}
