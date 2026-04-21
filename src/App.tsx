/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { 
  TrendingUp, Users, ShieldCheck, PieChart as PieChartIcon, 
  Filter, Search, ArrowUpRight, ArrowDownRight, 
  FileText, Download, Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  GLOBAL_DATA, ACUMULADO_DATA, PROVINCIAS, 
  INVESTIGATORS 
} from '@/src/data/mockData';
import { cn, formatCurrency } from '@/src/lib/utils';

// --- Components ---

const KpiCard = ({ title, value, subtext, trend, trendValue, id }: any) => (
  <motion.div 
    id={id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-4 rounded-sm shadow-none border border-brand-border flex flex-col justify-center min-h-[100px]"
  >
    <div className="flex justify-between items-start">
      <div className="p-1 px-2 border border-brand-border rounded text-xs font-bold text-brand-blue uppercase">
        {title.split(' ')[0]}
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-semibold",
          trend === 'up' ? "text-brand-success" : "text-rose-500"
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
    </div>
    <div className="mt-2 text-center">
      <h3 className="text-[11px] font-bold text-brand-gray uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-2xl font-light text-brand-blue leading-none">{value}</p>
      {subtext && <p className="text-[11px] text-brand-gray mt-1">{subtext}</p>}
    </div>
  </motion.div>
);

const ChartContainer = ({ title, children, className, id }: any) => (
  <motion.div 
    id={id}
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn("bg-white p-4 rounded-sm shadow-none border border-brand-border", className)}
  >
    <h3 className="text-sm font-bold text-brand-navy mb-4 border-b border-brand-bg pb-2 uppercase tracking-wide">{title}</h3>
    <div className="h-[250px] w-full">
      {children}
    </div>
  </motion.div>
);

// --- Main Application ---

export default function App() {
  // States
  const [activeTab, setActiveTab] = useState<'siniestros' | 'suscripcion'>('siniestros');
  const [filterPeriodo, setFilterPeriodo] = useState<string>('All');
  const [filterProvincia, setFilterProvincia] = useState<string>('All');
  const [filterResultado, setFilterResultado] = useState<string>('All');
  const [filterInvestigador, setFilterInvestigador] = useState<string>('All');
  const [filterCulpable, setFilterCulpable] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Filtered and Aggregated Data
  const filteredAcumulado = useMemo(() => {
    return ACUMULADO_DATA.filter(item => {
      const matchPeriodo = filterPeriodo === 'All' || item.periodo === filterPeriodo;
      const matchProvincia = filterProvincia === 'All' || item.provincia === filterProvincia;
      const matchResultado = filterResultado === 'All' || item.resultado === filterResultado;
      const matchInvestigador = filterInvestigador === 'All' || item.investigador === filterInvestigador;
      const matchCulpable = filterCulpable === 'All' || item.culpable === filterCulpable;
      const matchSearch = item.nroSiniestro.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.analista.toLowerCase().includes(searchTerm.toLowerCase());
      return matchPeriodo && matchProvincia && matchResultado && matchInvestigador && matchCulpable && matchSearch;
    });
  }, [filterPeriodo, filterProvincia, filterResultado, filterInvestigador, filterCulpable, searchTerm]);

  const stats = useMemo(() => {
    const totalAhorro = filteredAcumulado.reduce((acc, curr) => acc + curr.ahorro, 0);
    const uniqueSiniestros = new Set(filteredAcumulado.map(i => i.nroSiniestro)).size;
    
    // Promedio de días entre Fecha Siniestro y Fecha Denuncia
    const totalDays = filteredAcumulado.reduce((acc, curr) => {
      const start = new Date(curr.fechaSiniestro);
      const end = new Date(curr.fechaDenuncia);
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return acc + (isNaN(diff) ? 0 : Math.max(0, diff));
    }, 0);
    const avgDays = filteredAcumulado.length > 0 ? totalDays / filteredAcumulado.length : 0;

    const resultsMap = filteredAcumulado.reduce((acc: any, curr) => {
      acc[curr.resultado] = (acc[curr.resultado] || 0) + curr.ahorro;
      return acc;
    }, {});
    
    const topResultado = Object.keys(resultsMap).length > 0
      ? Object.keys(resultsMap).reduce((a, b) => resultsMap[a] > resultsMap[b] ? a : b)
      : 'Ninguno';
    
    const globalSummary = GLOBAL_DATA.filter(g => 
      (g.tipo.toLowerCase().includes(activeTab)) &&
      (filterPeriodo === 'All' || g.periodo === filterPeriodo)
    );
    
    const proyectadoTotal = globalSummary.reduce((acc, curr) => acc + curr.proyectado, 0);
    const cumplimientoAvg = globalSummary.length > 0 
      ? globalSummary.reduce((acc, curr) => acc + curr.tasaCumplimiento, 0) / globalSummary.length 
      : 0;

    return {
      totalAhorro,
      uniqueSiniestros,
      topResultado,
      proyectadoTotal,
      cumplimientoAvg,
      avgDays,
      ahorroVsMeta: (totalAhorro / (proyectadoTotal || 1)) * 100
    };
  }, [filteredAcumulado, activeTab, filterPeriodo]);

  const timeChartData = useMemo(() => {
    const periodos = ['ENERO', 'FEBRERO', 'MARZO'];
    return periodos.map(p => {
      const g = GLOBAL_DATA.find(item => item.periodo === p && item.tipo.toLowerCase().includes(activeTab));
      return {
        name: p,
        Proyectado: g?.proyectado || 0,
        Ejecutado: g?.ejecutado || 0,
        Cumplimiento: g?.tasaCumplimiento || 0
      };
    });
  }, [activeTab]);

  const outcomePieData = useMemo(() => {
    const data: any = {};
    filteredAcumulado.forEach(item => {
      data[item.resultado] = (data[item.resultado] || 0) + item.ahorro;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredAcumulado]);

  const provincePieData = useMemo(() => {
    const data: any = {};
    filteredAcumulado.forEach(item => {
      data[item.provincia] = (data[item.provincia] || 0) + item.ahorro;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredAcumulado]);

  const topInvestigatorsData = useMemo(() => {
    const data: any = {};
    filteredAcumulado.forEach(item => {
      data[item.investigador] = (data[item.investigador] || 0) + item.ahorro;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5);
  }, [filteredAcumulado]);

  const coverageStackData = useMemo(() => {
    const data: any = {};
    filteredAcumulado.forEach(item => {
      if (!data[item.coverage]) data[item.coverage] = { name: item.coverage, Cerrado: 0, Abierto: 0 };
      data[item.coverage][item.estado]++;
    });
    return Object.values(data);
  }, [filteredAcumulado]);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans text-brand-navy">
      <header className="bg-white border-b border-brand-border sticky top-0 z-30 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-blue w-8 h-8 rounded-sm flex items-center justify-center font-bold text-white shadow-sm">
            A
          </div>
          <div>
            <h1 className="text-base font-bold text-brand-navy leading-tight">Gestión de Siniestros & Suscripción</h1>
            <p className="text-[10px] text-brand-gray font-medium uppercase tracking-widest leading-tight mt-0.5">Ejercicio 2026 • CRM Analytics Architect View</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-brand-bg p-1 rounded-sm border border-brand-border h-9 items-center">
            <button 
              onClick={() => setActiveTab('siniestros')}
              className={cn(
                "px-3 py-1 rounded-sm text-[10px] font-bold transition-all duration-200 uppercase",
                activeTab === 'siniestros' ? "bg-white shadow-sm text-brand-blue" : "text-brand-gray hover:text-brand-navy"
              )}
            >
              Siniestros
            </button>
            <button 
              onClick={() => setActiveTab('suscripcion')}
              className={cn(
                "px-3 py-1 rounded-sm text-[10px] font-bold transition-all duration-200 uppercase",
                activeTab === 'suscripcion' ? "bg-white shadow-sm text-brand-blue" : "text-brand-gray hover:text-brand-navy"
              )}
            >
              Suscripción
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 h-9 bg-brand-blue text-white rounded-sm text-[10px] font-bold hover:opacity-90 transition-all uppercase shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden px-3 gap-3 pt-3 pb-3">
        <aside className="w-64 bg-white border border-brand-border rounded-sm p-4 flex flex-col gap-4 overflow-y-auto hidden lg:flex">
          <div className="flex items-center gap-2 text-brand-navy font-bold text-[11px] uppercase tracking-widest pb-2 border-b border-brand-bg">
            <Filter className="w-3.5 h-3.5" />
            Configuración
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">Periodo</label>
              <select 
                value={filterPeriodo} 
                onChange={(e) => setFilterPeriodo(e.target.value)}
                className="w-full bg-white border border-brand-border rounded-sm p-1.5 text-xs text-brand-navy outline-none focus:border-brand-blue transition-all"
              >
                <option value="All">Todos (Q1 2026)</option>
                <option value="ENERO">Enero</option>
                <option value="FEBRERO">Febrero</option>
                <option value="MARZO">Marzo</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">Provincia</label>
              <select 
                value={filterProvincia} 
                onChange={(e) => setFilterProvincia(e.target.value)}
                className="w-full bg-white border border-brand-border rounded-sm p-1.5 text-xs text-brand-navy outline-none focus:border-brand-blue transition-all"
              >
                <option value="All">Todas</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">Resultado</label>
              <select 
                value={filterResultado} 
                onChange={(e) => setFilterResultado(e.target.value)}
                className="w-full bg-white border border-brand-border rounded-sm p-1.5 text-xs text-brand-navy outline-none focus:border-brand-blue transition-all"
              >
                <option value="All">Acuerdo/Desist.</option>
                <option value="Acuerdo">Acuerdo</option>
                <option value="Desistimiento">Desistimiento</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">Investigador</label>
              <select 
                value={filterInvestigador} 
                onChange={(e) => setFilterInvestigador(e.target.value)}
                className="w-full bg-white border border-brand-border rounded-sm p-1.5 text-xs text-brand-navy outline-none focus:border-brand-blue transition-all"
              >
                <option value="All">Todos</option>
                {INVESTIGATORS.map(inv => <option key={inv} value={inv}>{inv}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">Culpable</label>
              <select 
                value={filterCulpable} 
                onChange={(e) => setFilterCulpable(e.target.value)}
                className="w-full bg-white border border-brand-border rounded-sm p-1.5 text-xs text-brand-navy outline-none focus:border-brand-blue transition-all"
              >
                <option value="All">Todos (Sí / No)</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="mt-auto bg-brand-bg rounded-sm p-3 border border-brand-border">
             <div className="text-[9px] font-bold text-brand-blue uppercase mb-1">Nota ETL</div>
             <div className="text-[9px] text-brand-gray leading-tight">
               1. Limpieza: trim(replace...) <br/>
               2. Join: Augment 'Periodo'
             </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto pr-1">
          <div className="mx-auto space-y-3">
            <div id="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <KpiCard 
                id="kpi-ahorro"
                title="Ahorro Total Ejecutado"
                value={formatCurrency(stats.totalAhorro)}
                subtext="▲ 4.2% vs Proyectado"
                trend={stats.ahorroVsMeta >= 100 ? 'up' : 'down'}
                trendValue={`${stats.ahorroVsMeta.toFixed(1)}%`}
              />
              <KpiCard 
                id="kpi-cumplimiento"
                title="Tasa Cumplimiento"
                value={`${stats.cumplimientoAvg.toFixed(1)}%`}
                subtext="Meta: 92.00%"
              />
              <KpiCard 
                id="kpi-siniestros"
                title="Siniestros Gestionados"
                value={stats.uniqueSiniestros.toLocaleString()}
                subtext="1,240 este mes"
              />
              <KpiCard 
                id="kpi-denuncia"
                title="Días a Denuncia (Avg)"
                value={`${stats.avgDays.toFixed(1)} d`}
                subtext="Siniestro → Denuncia"
              />
              <KpiCard 
                id="kpi-top-resultado"
                title="Top Resultado"
                value={stats.topResultado}
                subtext="62% del total"
              />
            </div>

            <div id="visuals-top" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
               <ChartContainer id="chart-performance" title="Proyectado vs Ejecutado & Cumplimiento (%)" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#706E6B'}} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} tick={{fill: '#706E6B'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '2px', border: '1px solid #D8DDE6', boxShadow: 'none' }}
                      itemStyle={{ fontSize: '10px' }}
                      formatter={(val: number) => [formatCurrency(val), '']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="Proyectado" fill="#B0ADAB" barSize={30} />
                    <Bar dataKey="Ejecutado" fill="#00A1E0" barSize={30} />
                    <Line type="monotone" dataKey="Cumplimiento" stroke="#FF9D3E" strokeWidth={2} dot={{ r: 3, fill: '#FF9D3E' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Ahorro por Provincia">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={provincePieData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {provincePieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#00A1E0' : '#E8E8E8'} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Legend iconType="rect" verticalAlign="bottom" wrapperStyle={{ fontSize: '9px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div id="visuals-bottom" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <ChartContainer id="chart-outcomes" title="Distribución por Resultado">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomePieData}
                      innerRadius={0}
                      outerRadius={75}
                      dataKey="value"
                    >
                      {outcomePieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer id="chart-investigators" title="Top Investigadores (Ranking)">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={topInvestigatorsData} margin={{ left: -30, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Bar dataKey="value" fill="#00A1E0" barSize={10} radius={[0, 1, 1, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer id="chart-coverage" title="Cobertura (Status Volume)">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coverageStackData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                    <XAxis dataKey="name" fontSize={9} interval={0} tickLine={false} axisLine={false} height={40} angle={-15} textAnchor="end" />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                    <Bar dataKey="Cerrado" stackId="a" fill="#00A1E0" />
                    <Bar dataKey="Abierto" stackId="a" fill="#E8E8E8" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div id="audit-table-section" className="bg-white rounded-sm border border-brand-border overflow-hidden mb-6">
              <div className="p-4 border-b border-brand-bg flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest">Detalle de Siniestros Granular (Auditoría)</h3>
                <div className="relative w-full md:w-72">
                  <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
                  <input 
                    type="text" 
                    id="search-input"
                    placeholder="Filtrar por nro. o analista..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-sm py-1.5 pl-9 pr-4 text-[10px] outline-none focus:border-brand-blue transition-all"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead className="bg-[#F3F2F2]">
                    <tr>
                      <th className="px-4 py-2 font-bold text-brand-gray uppercase border-b border-brand-border">Nro Siniestro</th>
                      <th className="px-4 py-2 font-bold text-brand-gray uppercase border-b border-brand-border">Provincia</th>
                      <th className="px-4 py-2 font-bold text-brand-gray uppercase border-b border-brand-border">Cobertura</th>
                      <th className="px-4 py-2 font-bold text-brand-gray uppercase border-b border-brand-border">Analista</th>
                      <th className="px-4 py-2 font-bold text-brand-gray uppercase border-b border-brand-border">Resultado</th>
                      <th className="px-4 py-2 font-bold text-brand-gray uppercase border-b border-brand-border text-right">Ahorro ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F2F2]">
                    {filteredAcumulado.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-brand-bg/50 transition-colors">
                        <td className="px-4 py-2 font-semibold text-brand-blue">{row.nroSiniestro}</td>
                        <td className="px-4 py-2 text-brand-navy">{row.provincia}</td>
                        <td className="px-4 py-2 text-brand-navy">{row.coverage}</td>
                        <td className="px-4 py-2 text-brand-navy">{row.analista}</td>
                        <td className="px-4 py-2">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase",
                            row.resultado === 'Acuerdo' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {row.resultado}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-bold text-brand-navy text-right">{formatCurrency(row.ahorro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-white border-t border-brand-border text-center">
                <button className="text-[9px] font-bold text-brand-blue hover:underline uppercase transition-all tracking-widest">
                  Ver registros completos • Augment por Periodo
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

