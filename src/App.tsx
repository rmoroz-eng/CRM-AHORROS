/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { 
  TrendingUp, Users, ShieldCheck, PieChart as PieChartIcon, 
  Filter, Search, ArrowUpRight, ArrowDownRight, 
  FileText, Download, Clock, Database, Plus, Trash2, Save, Grid, LayoutDashboard, Settings, Pencil, Edit2, Check, X,
  Columns as ColumnsIcon, Layers, Maximize2, Minimize2, Copy, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { ExcelGrid } from '@/src/components/ExcelGrid';
import { 
  GLOBAL_DATA, ACUMULADO_DATA, PROVINCIAS, 
  GlobalEntry,
  AccumulatedEntry
} from '@/src/data/mockData';
import { cn, formatCurrency } from '@/src/lib/utils';

// --- Components ---

const KpiCard = ({ title, value, subtext, trend, trendValue, id, info }: any) => (
  <motion.div 
    id={id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="group relative bg-white p-4 rounded-sm shadow-sm border border-brand-border flex flex-col justify-center min-h-[100px] cursor-default"
  >
    {/* Tooltip Emergente */}
    <div className="invisible group-hover:visible translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-48 p-2 bg-brand-navy text-white text-[9px] rounded shadow-xl z-50 pointer-events-none transition-all duration-200 uppercase tracking-wider leading-relaxed">
      {info || "Información del indicador"}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-brand-navy" />
    </div>

    <div className="flex justify-between items-start">
      <div className="p-1 px-2 border border-brand-border rounded text-xs font-bold text-brand-blue uppercase bg-brand-bg/30">
        {title.split(' ')[0]}
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-bg",
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
      {subtext && <p className="text-[11px] text-brand-gray mt-1 font-medium">{subtext}</p>}
    </div>
  </motion.div>
);

const ChartContainer = ({ title, children, className, id }: any) => (
  <motion.div 
    id={id}
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    className={cn("bg-white p-4 rounded-sm shadow-sm border border-brand-border", className)}
  >
    <div className="flex items-center justify-between mb-4 border-b border-brand-bg pb-2">
      <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide">{title}</h3>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-bg" />
        <div className="w-1.5 h-1.5 rounded-full bg-brand-bg" />
        <div className="w-1.5 h-1.5 rounded-full bg-brand-bg" />
      </div>
    </div>
    <div className="h-[250px] w-full">
      {children}
    </div>
  </motion.div>
);

// --- Main Application ---

// --- Dashboard Pane Component (For Comparison Mode) ---

const DashboardPane = ({ 
  panelId,
  config, 
  onConfigChange,
  globalData, 
  dashboards, 
  granularDataStore, 
  columnsDataStore,
  activeTab,
  isComparisonMode,
  activePanel,
  setActivePanel
}: any) => {
  const currentDashboard = dashboards.find((d: any) => d.id === config.dashboardId) || dashboards[0];
  const dashboardSourceId = currentDashboard?.sourceId || 'granular';
  const dashboardData = granularDataStore[dashboardSourceId] || [];
  const dashboardCols = columnsDataStore[dashboardSourceId] || [];

  const [showAllRows, setShowAllRows] = useState(false);

  const filteredAcumulado = useMemo(() => {
    return dashboardData.filter((item: any) => {
      const matchPeriodo = config.periodo === 'All' || item.periodo === config.periodo;
      const matchProvincia = config.provincia === 'All' || item.provincia === config.provincia;
      const matchResultado = config.resultado === 'All' || item.resultado === config.resultado;
      const matchInvestigador = config.investigador === 'All' || item.investigador === config.investigador;
      const matchCulpable = config.culpable === 'All' || item.culpable === config.culpable;
      const matchSearch = (String(item.nroSiniestro || '').toLowerCase()).includes(config.search.toLowerCase()) || 
                          (String(item.analista || '').toLowerCase()).includes(config.search.toLowerCase());
      return matchPeriodo && matchProvincia && matchResultado && matchInvestigador && matchCulpable && matchSearch;
    });
  }, [dashboardData, config]);

  const stats = useMemo(() => {
    const totalAhorro = filteredAcumulado.reduce((acc, curr) => acc + curr.ahorro, 0);
    const uniqueSiniestros = filteredAcumulado.filter(i => i.ahorro > 0).length;
    
    const totalDays = filteredAcumulado.reduce((acc, curr) => {
      const start = new Date(curr.fechaSiniestro);
      const end = new Date(curr.fechaDenuncia);
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return acc + (isNaN(diff) ? 0 : Math.max(0, diff));
    }, 0);
    const avgDays = filteredAcumulado.length > 0 ? totalDays / filteredAcumulado.length : 0;

    const globalSummary = globalData.filter((g: any) => 
      (g.tipo.toLowerCase().includes(activeTab === 'carga' ? 'siniestros' : activeTab)) &&
      (config.periodo === 'All' || g.periodo === config.periodo)
    );
    
    const proyectadoTotal = globalSummary.reduce((acc: number, curr: any) => acc + curr.proyectado, 0);
    const alcanceTotal = globalSummary.reduce((acc: number, curr: any) => acc + curr.ejecutado, 0);
    const planTotal = globalSummary.reduce((acc: number, curr: any) => acc + curr.plan, 0);
    const cumplimientoAvg = planTotal > 0 ? (alcanceTotal / planTotal) * 100 : 0;

    return {
      totalAhorro,
      uniqueSiniestros,
      proyectadoTotal,
      cumplimientoAvg,
      avgDays,
      ahorroVsMeta: (totalAhorro / (proyectadoTotal || 1)) * 100
    };
  }, [globalData, filteredAcumulado, activeTab, config.periodo]);

  const timeChartData = useMemo(() => {
    const periodos = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const currentType = activeTab === 'carga' ? 'Siniestros' : (activeTab === 'siniestros' ? 'Siniestros' : 'Suscripción');
    
    return periodos.map(p => {
      const g = globalData.find((item: any) => item.periodo === p && item.tipo === currentType);
      const plan = g?.plan || g?.proyectado || 0;
      const ejecutado = g?.ejecutado || 0;
      const cumplimiento = plan > 0 ? (ejecutado / plan) * 100 : 0;

      return {
        name: p,
        Proyectado: plan,
        Alcance: ejecutado,
        Cumplimiento: cumplimiento
      };
    });
  }, [globalData, activeTab]);

  const outcomePieData = useMemo(() => {
    const data: any = {};
    filteredAcumulado.forEach(item => {
      data[item.resultado] = (data[item.resultado] || 0) + item.ahorro;
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
      .sort((a: any, b: any) => (b.value as number) - (a.value as number))
      .slice(0, 5);
  }, [filteredAcumulado]);

  const COLORS = ['#00A1E0', '#FF9D3E', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
  const isActive = activePanel === panelId;

  return (
    <motion.div 
      onClick={() => setActivePanel(panelId)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex-1 flex flex-col gap-3 min-w-0 transition-all duration-300",
        isComparisonMode && !isActive && "opacity-70 saturate-50 scale-[0.98]",
        isComparisonMode && isActive && "ring-2 ring-brand-blue/30 rounded-sm p-1"
      )}
    >
      {isComparisonMode && (
        <div className="flex items-center justify-between bg-white border border-brand-border p-2 rounded-sm mb-1 shadow-sm">
           <div className="flex items-center gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                panelId === 'A' ? "bg-brand-blue text-white" : "bg-brand-gray text-white"
              )}>
                {panelId}
              </div>
              <select 
                 value={config.dashboardId}
                 onChange={(e) => onConfigChange({ ...config, dashboardId: e.target.value })}
                 className="text-[10px] font-bold uppercase text-brand-navy border-none focus:ring-0 cursor-pointer bg-transparent"
              >
                {dashboards.map((d: any) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
           </div>
           
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[60%]">
             <select 
               value={config.periodo}
               onChange={(e) => onConfigChange({ ...config, periodo: e.target.value })}
               className="text-[9px] font-bold uppercase text-brand-gray bg-brand-bg px-2 py-1 rounded-sm border-none focus:ring-1 focus:ring-brand-blue"
             >
               <option value="All">Período: Todos</option>
               {['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'].map(m => (
                 <option key={m} value={m}>{m}</option>
               ))}
             </select>
             <select 
               value={config.provincia}
               onChange={(e) => onConfigChange({ ...config, provincia: e.target.value })}
               className="text-[9px] font-bold uppercase text-brand-gray bg-brand-bg px-2 py-1 rounded-sm border-none focus:ring-1 focus:ring-brand-blue"
             >
               <option value="All">Provincia: Todas</option>
               {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
           </div>
        </div>
      )}

      <div className="space-y-3">
        <div id={`stats-grid-${panelId}`} className={cn("grid gap-3", isComparisonMode ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
          {currentDashboard?.widgets?.includes('kpi-ahorro') && (
            <KpiCard 
              id={`kpi-ahorro-${panelId}`}
              title="Ahorro Total Alcance"
              value={formatCurrency(stats.totalAhorro)}
              subtext="▲ 4.2% vs Proyectado"
              trend={stats.ahorroVsMeta >= 100 ? 'up' : 'down'}
              trendValue={`${stats.ahorroVsMeta.toFixed(1)}%`}
              info="Suma total de ahorros registrados en la grilla de auditoría para el período y filtros seleccionados."
            />
          )}
          {currentDashboard?.widgets?.includes('kpi-cumplimiento') && (
            <KpiCard 
              id={`kpi-cumplimiento-${panelId}`}
              title="Tasa Cumplimiento"
              value={`${stats.cumplimientoAvg.toFixed(1)}%`}
              subtext="Meta: 92.00%"
              info="Relación porcentual entre los ahorros reales logrados (Alcance) y la meta planificada (Plan) en el presupuesto mensual."
            />
          )}
          {currentDashboard?.widgets?.includes('kpi-siniestros') && (
            <KpiCard 
              id={`kpi-siniestros-${panelId}`}
              title="Siniestros con Ahorro"
              value={stats.uniqueSiniestros.toLocaleString()}
              subtext={`Total período: ${filteredAcumulado.length}`}
              info="Cantidad total de siniestros cerrados que generaron un ahorro positivo en la auditoría."
            />
          )}
        </div>

        {currentDashboard?.widgets?.includes('chart-performance') && (
          <div id={`visuals-top-${panelId}`} className="grid grid-cols-1 gap-3">
            <ChartContainer id={`chart-performance-${panelId}`} title="Proyectado vs Alcance & Cumplimiento (%)" className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#706E6B'}} />
                  <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} tick={{fill: '#706E6B'}} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val.toFixed(0)}%`} tick={{fill: '#FF9D3E'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '2px', border: '1px solid #D8DDE6', boxShadow: 'none' }}
                    itemStyle={{ fontSize: '10px' }}
                    formatter={(val: number, name: string) => {
                      if (name === 'Cumplimiento') return [`${val.toFixed(1)}%`, name];
                      return [formatCurrency(val), name];
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="Proyectado" fill="#B0ADAB" barSize={isComparisonMode ? 20 : 30} />
                  <Bar yAxisId="left" dataKey="Alcance" fill="#00A1E0" barSize={isComparisonMode ? 20 : 30} />
                  <Line yAxisId="right" type="monotone" dataKey="Cumplimiento" stroke="#FF9D3E" strokeWidth={2} dot={{ r: 3, fill: '#FF9D3E' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        <div id={`visuals-bottom-${panelId}`} className={cn("grid gap-3", isComparisonMode ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
          {currentDashboard?.widgets?.includes('chart-outcomes') && (
            <ChartContainer id={`chart-outcomes-${panelId}`} title="Distribución por Resultado">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 20 }}>
                  <Pie
                    data={outcomePieData}
                    innerRadius={0}
                    outerRadius={isComparisonMode ? 50 : 70}
                    dataKey="value"
                    labelLine={!isComparisonMode}
                    label={isComparisonMode ? false : ({ name, percent }) => {
                      const labelName = name.length > 8 ? `${name.substring(0, 8)}...` : name;
                      return `${labelName} ${(percent * 100).toFixed(0)}%`;
                    }}
                  >
                    {outcomePieData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}

          {currentDashboard?.widgets?.includes('chart-savings-study') && (
            <ChartContainer id={`chart-savings-study-${panelId}`} title="Ahorro por Estudio ($)">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInvestigatorsData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={8} 
                    interval={0} 
                    angle={-45} 
                    textAnchor="end" 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                     fontSize={8} 
                     tickLine={false} 
                     axisLine={false} 
                     tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} 
                  />
                  <Tooltip 
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{ fontSize: '10px', borderRadius: '2px' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}

          {currentDashboard?.widgets?.includes('chart-investigators') && (
            <ChartContainer id={`chart-investigators-${panelId}`} title="Top Investigadores">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={topInvestigatorsData} margin={{ left: -30, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Bar dataKey="value" fill="#00A1E0" barSize={10} radius={[0, 1, 1, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>

        {!isComparisonMode && (
          <div id="audit-table-section" className="bg-white rounded-sm border border-brand-border overflow-hidden mb-6">
            <div className="p-4 border-b border-brand-bg flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest">Detalle de Siniestros Granular (Auditoría)</h3>
              <div className="relative w-full md:w-72">
                <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
                <input 
                  type="text" 
                  placeholder="Filtrar por nro. o analista..."
                  value={config.search}
                  onChange={(e) => onConfigChange({ ...config, search: e.target.value })}
                  className="w-full bg-brand-bg border border-brand-border rounded-sm py-1.5 pl-9 pr-4 text-[10px] outline-none focus:border-brand-blue transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead className="bg-[#F3F2F2]">
                  <tr>
                    {currentDashboard?.visibleFields?.map((fieldId: string) => {
                      const col = dashboardCols.find((c: any) => c.id === fieldId);
                      return (
                        <th key={fieldId} className="px-4 py-2 font-bold text-brand-gray uppercase border-b border-brand-border">
                          {col?.name || fieldId}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F2F2]">
                  {filteredAcumulado.slice(0, showAllRows ? undefined : 15).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-brand-bg/50 transition-colors text-brand-navy">
                      {currentDashboard?.visibleFields?.map((fieldId: string) => {
                        const col = dashboardCols.find((c: any) => c.id === fieldId);
                        const value = row[fieldId];
                        return (
                          <td key={fieldId} className={cn("px-4 py-2", col?.type === 'currency' && "font-bold text-right")}>
                            {col?.type === 'currency' ? formatCurrency(value) : String(value || '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-white border-t border-brand-border text-center">
              <button 
                onClick={() => setShowAllRows(!showAllRows)}
                className="text-[9px] font-bold text-brand-blue hover:underline uppercase transition-all tracking-widest"
              >
                {showAllRows ? 'Ver menos' : 'Ver registros completos • Augment por Periodo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default function App() {
  // Navigation States
  const [activeTab, setActiveTab] = useState<'siniestros' | 'suscripcion' | 'carga'>('siniestros');
  
  // Data Views System
  type ViewType = 'mensual' | 'granular';
  interface DataView {
    id: string;
    title: string;
    type: ViewType;
    dataKey: string;
    columnsKey?: string;
  }

  interface DashboardConfig {
    id: string;
    title: string;
    sourceId: string;
    visibleFields: string[];
    widgets: string[];
  }

  const [dataViews, setDataViews] = useState<DataView[]>(() => {
    const saved = localStorage.getItem('crm_data_views');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'mensual', title: 'Planificación Mensual', type: 'mensual', dataKey: 'crm_global_data' },
      { id: 'granular', title: 'Registros Granulares', type: 'granular', dataKey: 'crm_acumulado_data', columnsKey: 'crm_audit_columns' }
    ];
  });

  const [dashboards, setDashboards] = useState<DashboardConfig[]>(() => {
    const saved = localStorage.getItem('crm_dashboards');
    if (saved) return JSON.parse(saved);
    return [
      { 
        id: 'default', 
        title: 'Tablero General', 
        sourceId: 'granular', 
        visibleFields: ['nroSiniestro', 'provincia', 'periodo', 'resultado', 'ahorro', 'investigador'],
        widgets: ['kpi-ahorro', 'kpi-cumplimiento', 'kpi-siniestros', 'chart-performance', 'chart-outcomes', 'chart-savings-study', 'chart-investigators']
      }
    ];
  });

  const [activeDashboardId, setActiveDashboardId] = useState<string>(() => dashboards[0]?.id || '');
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
  const [newDashTitle, setNewDashTitle] = useState('');
  const [newDashSource, setNewDashSource] = useState('granular');
  const [newDashFields, setNewDashFields] = useState<string[]>([]);
  const [newDashWidgets, setNewDashWidgets] = useState<string[]>(['kpi-ahorro', 'kpi-cumplimiento', 'kpi-siniestros', 'chart-performance', 'chart-outcomes', 'chart-savings-study', 'chart-investigators']);
  const [editingDashId, setEditingDashId] = useState<string | null>(null);
  const [dashIdToConfirmDelete, setDashIdToConfirmDelete] = useState<string | null>(null);

  const AVAILABLE_WIDGETS = [
    { id: 'kpi-ahorro', name: 'KPI: Ahorro Total' },
    { id: 'kpi-cumplimiento', name: 'KPI: Tasa Cumplimiento' },
    { id: 'kpi-siniestros', name: 'KPI: Siniestros con Ahorro' },
    { id: 'chart-performance', name: 'Gráfico: Proyectado vs Alcance' },
    { id: 'chart-outcomes', name: 'Gráfico: Distribución por Resultado' },
    { id: 'chart-savings-study', name: 'Gráfico: Ahorro por Estudio' },
    { id: 'chart-investigators', name: 'Gráfico: Top Investigadores' },
  ];

  const [cargaSubView, setCargaSubView] = useState<string>(() => dataViews[0]?.id || '');
  const [editingTitleKey, setEditingTitleKey] = useState<string | null>(null);
  const [isCreatingView, setIsCreatingView] = useState(false);
  const [newViewTitle, setNewViewTitle] = useState('');

  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Persistence for Views Structure
  useEffect(() => {
    safeSetItem('crm_data_views', JSON.stringify(dataViews));
  }, [dataViews]);

  // Dynamic Data Store for Granular Views
  const [granularDataStore, setGranularDataStore] = useState<Record<string, any[]>>(() => {
    const store: Record<string, any[]> = {};
    dataViews.forEach(v => {
      if (v.type === 'granular') {
        const saved = localStorage.getItem(v.dataKey);
        store[v.id] = saved ? JSON.parse(saved) : (v.id === 'granular' ? ACUMULADO_DATA : []);
      }
    });
    return store;
  });

  const [columnsDataStore, setColumnsDataStore] = useState<Record<string, any[]>>(() => {
    const store: Record<string, any[]> = {};
    dataViews.forEach(v => {
      if (v.type === 'granular' && v.columnsKey) {
        const saved = localStorage.getItem(v.columnsKey);
        store[v.id] = saved ? JSON.parse(saved) : [
          { id: 'nroSiniestro', name: 'Nro Siniestro', type: 'text', required: true },
          { id: 'provincia', name: 'Provincia', type: 'text' },
          { id: 'periodo', name: 'Periodo', type: 'text' },
          { id: 'resultado', name: 'Resultado', type: 'text' },
          { id: 'ahorro', name: 'Ahorro', type: 'currency' },
          { id: 'seccion', name: 'Sección', type: 'text' },
          { id: 'investigador', name: 'Investigador', type: 'text' },
          { id: 'analista', name: 'Analista', type: 'text' },
          { id: 'estado', name: 'Estado', type: 'text' },
        ];
      }
    });
    return store;
  });

  const [viewIdToConfirmDelete, setViewIdToConfirmDelete] = useState<string | null>(null);

  const deleteDataView = (id: string) => {
    if (dataViews.length <= 1) {
      alert("Al menos debe quedar una vista de datos.");
      return;
    }
    
    const viewToDelete = dataViews.find(v => v.id === id);
    
    setDataViews(prev => {
      const nextViews = prev.filter(v => v.id !== id);
      if (cargaSubView === id) {
        setCargaSubView(nextViews[0]?.id || '');
      }
      
      // Update any dashboard that was using this source
      setDashboards(dPrev => dPrev.map(d => d.sourceId === id ? { ...d, sourceId: nextViews[0]?.id || 'granular' } : d));
      
      return nextViews;
    });
    
    setGranularDataStore(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setColumnsDataStore(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (viewToDelete) {
      localStorage.removeItem(viewToDelete.dataKey);
      if (viewToDelete.columnsKey) localStorage.removeItem(viewToDelete.columnsKey);
    }
    setViewIdToConfirmDelete(null);
  };

  // Simple Global Data (keeping it separate for now as it has a very specific structure)
  const [globalData, setGlobalData] = useState<GlobalEntry[]>(() => {
    const saved = localStorage.getItem('crm_global_data');
    if (saved) return JSON.parse(saved);
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const initial: GlobalEntry[] = [];
    ['Siniestros', 'Suscripción'].forEach(tipo => {
      meses.forEach(mes => {
        const existing = GLOBAL_DATA.find(d => d.periodo === mes && d.tipo === tipo);
        if (existing) initial.push(existing);
        else initial.push({
          periodo: mes, tipo: tipo as any, trimestre: 'Q1', proyectado: 0, ejecutado: 0,
          incurridoIB: 0, plan: 0, ejecutadoReal: 0, planPercentAhorroIB: 0, tasaCumplimiento: 0
        });
      });
    });
    return initial;
  });

  // Convenience alias for current view data
  const currentGranularRows = granularDataStore[cargaSubView] || [];
  const currentGranularCols = columnsDataStore[cargaSubView] || [];

  const currentDashboard = useMemo(() => 
    dashboards.find(d => d.id === activeDashboardId) || dashboards[0]
  , [dashboards, activeDashboardId]);

  const dashboardSourceId = currentDashboard?.sourceId || 'granular'; 

  const dashboardData = granularDataStore[dashboardSourceId] || [];
  const dashboardCols = columnsDataStore[dashboardSourceId] || [];

  const updateDashboardSource = (id: string, sourceId: string) => {
    setDashboards(prev => prev.map(d => d.id === id ? { ...d, sourceId } : d));
  };

  const deleteDashboard = (id: string) => {
    if (dashboards.length <= 1) {
      alert("Al menos debe quedar un tablero.");
      return;
    }
    
    setDashboards(prev => {
      const nextDashboards = prev.filter(d => d.id !== id);
      if (activeDashboardId === id) {
        setActiveDashboardId(nextDashboards[0]?.id || '');
      }
      return nextDashboards;
    });
    
    setDashIdToConfirmDelete(null);
  };

  // Persistence for Dashboards Structure
  useEffect(() => {
    safeSetItem('crm_dashboards', JSON.stringify(dashboards));
  }, [dashboards]);

  // Persistence Effects for dynamic store
  useEffect(() => {
    Object.entries(granularDataStore).forEach(([id, data]) => {
      const view = dataViews.find(v => v.id === id);
      if (view) safeSetItem(view.dataKey, JSON.stringify(data));
    });
  }, [granularDataStore, dataViews]);

  useEffect(() => {
    Object.entries(columnsDataStore).forEach(([id, cols]) => {
      const view = dataViews.find(v => v.id === id);
      if (view && view.columnsKey) safeSetItem(view.columnsKey, JSON.stringify(cols));
    });
  }, [columnsDataStore, dataViews]);

  useEffect(() => {
    safeSetItem('crm_global_data', JSON.stringify(globalData));
  }, [globalData]);

  // Perspective states
  const [filterPeriodo, setFilterPeriodo] = useState<string>('All');
  const [filterProvincia, setFilterProvincia] = useState<string>('All');
  const [filterResultado, setFilterResultado] = useState<string>('All');
  const [filterInvestigador, setFilterInvestigador] = useState<string>('All');
  const [filterCulpable, setFilterCulpable] = useState<string>('All');
  const [showAllRows, setShowAllRows] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Comparison Integration
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  
  interface PanelFilterState {
    dashboardId: string;
    periodo: string;
    provincia: string;
    resultado: string;
    investigador: string;
    culpable: string;
    search: string;
  }

  const initialPanelState: PanelFilterState = {
    dashboardId: dashboards[0]?.id || 'default',
    periodo: 'All',
    provincia: 'All',
    resultado: 'All',
    investigador: 'All',
    culpable: 'All',
    search: ''
  };

  const [panelA, setPanelA] = useState<PanelFilterState>(initialPanelState);
  const [panelB, setPanelB] = useState<PanelFilterState>({ ...initialPanelState, periodo: 'FEBRERO' }); // Default second panel to another month
  const [activePanel, setActivePanel] = useState<'A' | 'B'>('A');

  // Synchronize global filters with Panel A when not in comparison mode
  useEffect(() => {
    if (!isComparisonMode) {
      setFilterPeriodo(panelA.periodo);
      setFilterProvincia(panelA.provincia);
      setFilterResultado(panelA.resultado);
      setFilterInvestigador(panelA.investigador);
      setFilterCulpable(panelA.culpable);
      setSearchTerm(panelA.search);
      setActiveDashboardId(panelA.dashboardId);
    }
  }, [panelA, isComparisonMode]);

  const COLORS = ['#00A1E0', '#FF9D3E', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  // Dynamic filter options based on source data
  const dynamicInvestigators = useMemo(() => {
    const list = Array.from(new Set(dashboardData.map((item: any) => String(item.investigador || '').trim())))
      .filter(Boolean)
      .sort();
    return list;
  }, [dashboardData]);

  // Derived Data (Calculated from states)
  const filteredAcumulado = useMemo(() => {
    return dashboardData.filter((item: any) => {
      const matchPeriodo = filterPeriodo === 'All' || item.periodo === filterPeriodo;
      const matchProvincia = filterProvincia === 'All' || item.provincia === filterProvincia;
      const matchResultado = filterResultado === 'All' || item.resultado === filterResultado;
      const matchInvestigador = filterInvestigador === 'All' || item.investigador === filterInvestigador;
      const matchCulpable = filterCulpable === 'All' || item.culpable === filterCulpable;
      const matchSearch = (String(item.nroSiniestro || '').toLowerCase()).includes(searchTerm.toLowerCase()) || 
                          (String(item.analista || '').toLowerCase()).includes(searchTerm.toLowerCase());
      return matchPeriodo && matchProvincia && matchResultado && matchInvestigador && matchCulpable && matchSearch;
    });
  }, [dashboardData, filterPeriodo, filterProvincia, filterResultado, filterInvestigador, filterCulpable, searchTerm]);

  const stats = useMemo(() => {
    const totalAhorro = filteredAcumulado.reduce((acc, curr) => acc + curr.ahorro, 0);
    // Filtrar siniestros cerrados con ahorro (ahorro > 0)
    const uniqueSiniestros = filteredAcumulado.filter(i => i.ahorro > 0).length;
    
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
    
    const globalSummary = globalData.filter(g => 
      (g.tipo.toLowerCase().includes(activeTab === 'carga' ? 'siniestros' : activeTab)) &&
      (filterPeriodo === 'All' || g.periodo === filterPeriodo)
    );
    
    const proyectadoTotal = globalSummary.reduce((acc, curr) => acc + curr.proyectado, 0);
    const alcanceTotal = globalSummary.reduce((acc, curr) => acc + curr.ejecutado, 0);
    const planTotal = globalSummary.reduce((acc, curr) => acc + curr.plan, 0);
    
    // Tasa cumplimiento = total alcance / total plan
    const cumplimientoAvg = planTotal > 0 ? (alcanceTotal / planTotal) * 100 : 0;

    return {
      totalAhorro,
      uniqueSiniestros,
      topResultado,
      proyectadoTotal,
      cumplimientoAvg,
      avgDays,
      ahorroVsMeta: (totalAhorro / (proyectadoTotal || 1)) * 100
    };
  }, [globalData, filteredAcumulado, activeTab, filterPeriodo]);

  const timeChartData = useMemo(() => {
    const periodos = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const currentType = activeTab === 'carga' ? 'Siniestros' : (activeTab === 'siniestros' ? 'Siniestros' : 'Suscripción');
    
    return periodos.map(p => {
      const g = globalData.find(item => item.periodo === p && item.tipo === currentType);
      const plan = g?.plan || g?.proyectado || 0;
      const ejecutado = g?.ejecutado || 0;
      const cumplimiento = plan > 0 ? (ejecutado / plan) * 100 : 0;

      return {
        name: p,
        Proyectado: plan,
        Alcance: ejecutado,
        Cumplimiento: cumplimiento
      };
    });
  }, [globalData, activeTab]);

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

  const seccionStackData = useMemo(() => {
    const data: Record<string, number> = {
      'Autos': 0,
      'Motos': 0,
      'Rs.Vs.': 0
    };

    filteredAcumulado.forEach(item => {
      // Solo contar siniestros con ahorro > 0
      if (item.ahorro > 0) {
        const s = String(item.seccion);
        if (s === '1') {
          data['Autos']++;
        } else if (s === '21') {
          data['Motos']++;
        } else {
          data['Rs.Vs.']++;
        }
      }
    });

    const result = Object.entries(data).map(([name, count]) => ({ name, count }));
    console.log("seccionStackData:", result);
    return result;
  }, [filteredAcumulado]);

  // Handlers for Data Entry
  const updateGlobalValue = (periodo: string, tipo: string, field: keyof GlobalEntry, value: any) => {
    setGlobalData(prev => prev.map(item => {
      if (item.periodo === periodo && item.tipo === tipo) {
        const newItem = { ...item, [field]: value };
        
        // Auto-calculate dependencies
        if (field === 'incurridoIB' || field === 'planPercentAhorroIB') {
          const inc = field === 'incurridoIB' ? value : item.incurridoIB;
          const perc = field === 'planPercentAhorroIB' ? value : item.planPercentAhorroIB;
          newItem.plan = inc * (perc / 100);
          newItem.proyectado = newItem.plan;
        }
        
        if (field === 'ejecutado' || field === 'incurridoIB' || field === 'planPercentAhorroIB') {
          const exec = field === 'ejecutado' ? value : item.ejecutado;
          const inc = field === 'incurridoIB' ? value : item.incurridoIB;
          const plan = newItem.plan || (inc * (item.planPercentAhorroIB / 100));
          
          newItem.ejecutadoReal = exec;
          newItem.tasaCumplimiento = plan > 0 ? (exec / plan) * 100 : 0;
        }

        return newItem;
      }
      return item;
    }));
  };

  const updateGranularValue = (index: number, field: string, value: any) => {
    setGranularDataStore(prev => {
      const currentId = cargaSubView;
      if (!prev[currentId]) return prev;
      const next = [...prev[currentId]];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [currentId]: next };
    });
  };

  const addGranularRow = () => {
    setGranularDataStore(prev => {
        const currentId = cargaSubView;
        if (!prev[currentId]) return prev;
        const newEntry = {
            nroSiniestro: `SIN-${Date.now()}`,
            fechaSiniestro: new Date().toISOString().split('T')[0],
            estado: 'Abierto',
            ahorro: 0
        };
        return { ...prev, [currentId]: [newEntry, ...prev[currentId]] };
    });
  };

  const currentView = dataViews.find(v => v.id === cargaSubView);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans text-brand-navy">
      <header className="bg-white border-b border-brand-border sticky top-0 z-30 px-6 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-brand-blue w-8 h-8 rounded-sm flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-brand-blue/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-brand-navy leading-tight">Garantía Auditing</h1>
              <p className="text-[10px] text-brand-gray font-medium uppercase tracking-widest leading-tight mt-0.5">Ejercicio 2026 • CRM Analytics</p>
            </div>
          </div>

          <div className="h-6 w-px bg-brand-border" />

          {/* Comparison Mode Toggle */}
          <div className="flex items-center bg-brand-bg p-1 rounded-sm border border-brand-border h-9">
            <button 
              onClick={() => setIsComparisonMode(false)}
              className={cn(
                "px-3 py-1.5 rounded-sm text-[10px] font-bold transition-all uppercase flex items-center gap-2",
                !isComparisonMode ? "bg-white shadow-sm text-brand-blue" : "text-brand-gray hover:text-brand-navy"
              )}
              title="Vista Única"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Individual</span>
            </button>
            <button 
              onClick={() => setIsComparisonMode(true)}
              className={cn(
                "px-3 py-1.5 rounded-sm text-[10px] font-bold transition-all uppercase flex items-center gap-2",
                isComparisonMode ? "bg-white shadow-sm text-brand-blue" : "text-brand-gray hover:text-brand-navy"
              )}
              title="Vista Comparativa"
            >
              <ColumnsIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Comparativa</span>
            </button>
          </div>

          {isComparisonMode && (
             <button 
               onClick={() => {
                 if (activePanel === 'A') setPanelB({ ...panelA });
                 else setPanelA({ ...panelB });
                 alert("Paneles sincronizados exitosamente.");
               }}
               className="flex items-center gap-2 px-3 py-2 border border-brand-blue/30 text-brand-blue rounded-sm text-[10px] font-bold uppercase hover:bg-blue-50 transition-all font-mono"
             >
               <RefreshCw className="w-3 h-3" />
               Sincronizar
             </button>
          )}
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
              onClick={() => setActiveTab('carga')}
              className={cn(
                "px-3 py-1 rounded-sm text-[10px] font-bold transition-all duration-200 uppercase flex items-center gap-1.5",
                activeTab === 'carga' ? "bg-white shadow-sm text-brand-blue" : "text-brand-gray hover:text-brand-navy"
              )}
            >
              <Database className="w-3 h-3" />
              Carga
            </button>
          </div>
          <button 
            onClick={() => {
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.text("Resumen Ejecutivo: Gestión de Siniestros", 14, 15);
                
                doc.setFontSize(11);
                doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 25);
                
                const kpiData = [
                  ['Concepto', 'Valor'],
                  ['Ahorro Total', formatCurrency(stats.totalAhorro)],
                  ['Tasa Cumplimiento', `${stats.cumplimientoAvg.toFixed(1)}%`],
                  ['Siniestros Auditados', stats.uniqueSiniestros.toString()]
                ];
                
                autoTable(doc, {
                  head: [kpiData[0]],
                  body: kpiData.slice(1),
                  startY: 35,
                  theme: 'striped'
                });

                const outcomeData = [
                    ['Resultado', 'Monto ($)'],
                    ...outcomePieData.map((d: any) => [d.name, formatCurrency(d.value)])
                ];

                autoTable(doc, {
                    head: [outcomeData[0]],
                    body: outcomeData.slice(1),
                    startY: (doc as any).lastAutoTable.finalY + 10,
                    theme: 'striped'
                });

                doc.save("Resumen_Ejecutivo_Siniestros.pdf");
            }}
            className="flex items-center gap-2 px-3 py-1.5 h-9 bg-brand-blue text-white rounded-sm text-[10px] font-bold hover:opacity-90 transition-all uppercase shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar a PDF
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden px-3 gap-3 pt-3 pb-3">
        {/* Adaptive Sidebar */}
        <aside className="w-64 bg-white border border-brand-border rounded-sm p-4 flex flex-col gap-4 overflow-y-auto hidden lg:flex">
          {activeTab === 'carga' ? (
            <>
              <div className="flex items-center gap-2 text-brand-navy font-bold text-[11px] uppercase tracking-widest pb-2 border-b border-brand-bg">
                <Grid className="w-3.5 h-3.5" />
                Gestión de Datos
              </div>
              <div className="flex flex-col gap-1">
                {dataViews.map(view => (
                  <div key={view.id} className="flex items-center group relative">
                    {editingTitleKey === view.id ? (
                      <input 
                        autoFocus
                        type="text"
                        defaultValue={view.title}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const newTitle = (e.target as HTMLInputElement).value;
                                setDataViews(prev => prev.map(v => v.id === view.id ? { ...v, title: newTitle } : v));
                                setEditingTitleKey(null);
                            }
                            if (e.key === 'Escape') {
                                setEditingTitleKey(null);
                            }
                        }}
                        onBlur={(e) => {
                          const newTitle = e.target.value;
                          setDataViews(prev => prev.map(v => v.id === view.id ? { ...v, title: newTitle } : v));
                          setEditingTitleKey(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase transition-all rounded-sm bg-blue-50 outline-none ring-2 ring-brand-blue/50"
                      />
                    ) : (
                      <button 
                        onClick={() => setCargaSubView(view.id)}
                        onDoubleClick={() => setEditingTitleKey(view.id)}
                        title="Doble clic para renombrar"
                        className={cn(
                          "flex-1 text-left px-3 py-2 text-[10px] font-bold uppercase transition-all rounded-sm pr-10",
                          cargaSubView === view.id ? "bg-brand-blue text-white shadow-sm" : "text-brand-gray hover:bg-brand-bg hover:text-brand-navy"
                        )}
                      >
                        {view.title}
                      </button>
                    )}
                    <div className={cn(
                      "absolute right-1 flex items-center transition-all",
                      cargaSubView === view.id ? (viewIdToConfirmDelete === view.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 text-white") : (viewIdToConfirmDelete === view.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 text-brand-gray")
                    )}>
                      {viewIdToConfirmDelete === view.id ? (
                        <div className="flex items-center gap-0.5 bg-rose-500 rounded-sm">
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteDataView(view.id); }} 
                            title="Confirmar eliminación"
                            className="p-1.5 hover:bg-white/20 text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewIdToConfirmDelete(null); }} 
                            title="Cancelar"
                            className="p-1.5 hover:bg-white/20 text-white border-l border-white/20"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingTitleKey(view.id); }} 
                            title="Renombrar"
                            className="p-1.5 rounded-sm hover:bg-white/20"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewIdToConfirmDelete(view.id); }} 
                            title="Eliminar"
                            className="p-1.5 rounded-sm hover:bg-rose-500/20 text-inherit"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {isCreatingView ? (
                  <div className="mt-2">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Nombre..."
                      value={newViewTitle}
                      onChange={(e) => setNewViewTitle(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && newViewTitle.trim()) {
                              const id = `custom_${Date.now()}`;
                              const title = newViewTitle.trim();
                              const newView: DataView = {
                                  id,
                                  title,
                                  type: 'granular',
                                  dataKey: `crm_data_${id}`,
                                  columnsKey: `crm_cols_${id}`
                              };
                              setDataViews(prev => [...prev, newView]);
                              setGranularDataStore(prev => ({ ...prev, [id]: [] }));
                              setColumnsDataStore(prev => ({ ...prev, [id]: [...(columnsDataStore['granular'] || [])] }));
                              setCargaSubView(id);
                              setIsCreatingView(false);
                              setNewViewTitle('');
                          }
                          if (e.key === 'Escape') {
                              setIsCreatingView(false);
                              setNewViewTitle('');
                          }
                      }}
                      onBlur={() => {
                          if (!newViewTitle.trim()) {
                              setIsCreatingView(false);
                          }
                      }}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase transition-all rounded-sm bg-blue-50 outline-none ring-2 ring-brand-blue/50"
                    />
                    <div className="flex justify-between mt-1 px-1">
                        <span className="text-[8px] text-brand-gray uppercase">Enter para crear</span>
                        <span className="text-[8px] text-brand-gray uppercase">Esc para cancelar</span>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsCreatingView(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 border border-brand-blue/30 text-brand-blue rounded-sm text-[10px] font-bold uppercase hover:bg-blue-50 transition-all font-mono"
                  >
                    <Plus className="w-3 h-3" />
                    Nuevo Registro
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-brand-navy font-bold text-[11px] uppercase tracking-widest pb-2 border-b border-brand-bg">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Mis Tableros
              </div>
              <div className="flex flex-col gap-1 mb-4">
                {dashboards.map(dash => (
                  <div key={dash.id} className="flex items-center group relative">
                    {editingDashId === dash.id ? (
                      <input 
                        autoFocus
                        type="text"
                        defaultValue={dash.title}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const newTitle = (e.target as HTMLInputElement).value;
                                setDashboards(prev => prev.map(d => d.id === dash.id ? { ...d, title: newTitle } : d));
                                setEditingDashId(null);
                            }
                            if (e.key === 'Escape') setEditingDashId(null);
                        }}
                        onBlur={(e) => {
                          const newTitle = e.target.value;
                          setDashboards(prev => prev.map(d => d.id === dash.id ? { ...d, title: newTitle } : d));
                          setEditingDashId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase transition-all rounded-sm bg-blue-50 outline-none ring-2 ring-brand-blue/50"
                      />
                    ) : (
                      <button 
                        onClick={() => setActiveDashboardId(dash.id)}
                        onDoubleClick={() => setEditingDashId(dash.id)}
                        className={cn(
                          "flex-1 text-left px-3 py-2 text-[10px] font-bold uppercase transition-all rounded-sm pr-16",
                          activeDashboardId === dash.id ? "bg-brand-blue text-white shadow-sm" : "text-brand-gray hover:bg-brand-bg hover:text-brand-navy"
                        )}
                      >
                        {dash.title}
                      </button>
                    )}
                    <div className={cn(
                      "absolute right-1 flex items-center transition-all",
                      activeDashboardId === dash.id ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      activeDashboardId === dash.id ? "text-white" : "text-brand-gray"
                    )}>
                      {dashIdToConfirmDelete === dash.id ? (
                        <div className="flex items-center gap-0.5 bg-rose-500 rounded-sm">
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteDashboard(dash.id); }} 
                            className="p-1.5 hover:bg-white/20 text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDashIdToConfirmDelete(null); }} 
                            className="p-1.5 hover:bg-white/20 text-white border-l border-white/20"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingDashId(dash.id); }} 
                            className="p-1.5 rounded-sm hover:bg-white/20"
                            title="Renombrar"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDashIdToConfirmDelete(dash.id); }} 
                            className="p-1.5 rounded-sm hover:bg-rose-500/20 text-inherit"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {isCreatingDashboard ? (
                  <div className="p-3 bg-brand-bg/50 rounded-sm border border-brand-border space-y-2 mt-2">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Nombre Tablero..."
                      value={newDashTitle}
                      onChange={(e) => setNewDashTitle(e.target.value)}
                      className="w-full text-[10px] p-2 outline-none border border-brand-border focus:ring-1 focus:ring-brand-blue"
                    />
                    <div className="space-y-1">
                       <label className="text-[8px] font-bold text-brand-gray uppercase">Origen de Datos</label>
                       <select 
                         value={newDashSource}
                         onChange={(e) => setNewDashSource(e.target.value)}
                         className="w-full text-[9px] p-1 border border-brand-border outline-none"
                       >
                         {dataViews.filter(v => v.type === 'granular').map(v => (
                           <option key={v.id} value={v.id}>{v.title}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-bold text-brand-gray uppercase">CAMPOS DETALLE (Opcional)</label>
                       <div className="max-h-24 overflow-y-auto border border-brand-border p-1 bg-white">
                          {(columnsDataStore[newDashSource] || []).map((col: any) => (
                            <label key={col.id} className="flex items-center gap-2 text-[8px] uppercase p-1 hover:bg-brand-bg cursor-pointer">
                               <input 
                                 type="checkbox"
                                 checked={newDashFields.includes(col.id)}
                                 onChange={(e) => {
                                   if (e.target.checked) setNewDashFields([...newDashFields, col.id]);
                                   else setNewDashFields(newDashFields.filter(f => f !== col.id));
                                 }}
                               />
                               {col.name}
                            </label>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-bold text-brand-gray uppercase">GRÁFICOS / INDICADORES</label>
                       <div className="max-h-24 overflow-y-auto border border-brand-border p-1 bg-white">
                          {AVAILABLE_WIDGETS.map((widget) => (
                            <label key={widget.id} className="flex items-center gap-2 text-[8px] uppercase p-1 hover:bg-brand-bg cursor-pointer">
                               <input 
                                 type="checkbox"
                                 checked={newDashWidgets.includes(widget.id)}
                                 onChange={(e) => {
                                   if (e.target.checked) setNewDashWidgets([...newDashWidgets, widget.id]);
                                   else setNewDashWidgets(newDashWidgets.filter(w => w !== widget.id));
                                 }}
                               />
                               {widget.name}
                            </label>
                          ))}
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => {
                           if (!newDashTitle.trim()) return;
                           const id = `dash_${Date.now()}`;
                           const newDash: DashboardConfig = {
                             id,
                             title: newDashTitle.trim(),
                             sourceId: newDashSource,
                             visibleFields: newDashFields.length > 0 ? newDashFields : (columnsDataStore[newDashSource] || []).map((c: any) => c.id),
                             widgets: newDashWidgets
                           };
                           setDashboards([...dashboards, newDash]);
                           setActiveDashboardId(id);
                           setIsCreatingDashboard(false);
                           setNewDashTitle('');
                           setNewDashFields([]);
                         }}
                         className="flex-1 py-1.5 bg-brand-blue text-white text-[9px] font-bold uppercase rounded-sm"
                       >
                         Crear
                       </button>
                       <button 
                         onClick={() => {
                           setIsCreatingDashboard(false);
                           setNewDashTitle('');
                           setNewDashFields([]);
                         }}
                         className="flex-1 py-1.5 border border-brand-border text-brand-gray text-[9px] font-bold uppercase rounded-sm"
                       >
                         Cancelar
                       </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsCreatingDashboard(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 border border-brand-blue/30 text-brand-blue rounded-sm text-[10px] font-bold uppercase hover:bg-blue-50 transition-all font-mono"
                  >
                    <Plus className="w-3 h-3" />
                    Crear Tablero
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-brand-navy font-bold text-[11px] uppercase tracking-widest pb-2 border-b border-brand-bg">
                <Filter className="w-3.5 h-3.5" />
                Configuración {isComparisonMode && `(Panel ${activePanel})`}
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-blue uppercase tracking-widest flex items-center gap-1.5 mb-1 bg-blue-50 p-1.5 rounded-sm border border-blue-100">
                    <Database className="w-3 h-3" />
                    Tablero Activo
                  </label>
                  <select 
                    value={activePanel === 'A' ? panelA.dashboardId : panelB.dashboardId} 
                    onChange={(e) => {
                      const upd = { dashboardId: e.target.value };
                      if (activePanel === 'A') setPanelA(prev => ({ ...prev, ...upd }));
                      else setPanelB(prev => ({ ...prev, ...upd }));
                    }}
                    className="w-full bg-white border border-brand-border rounded-sm p-1.5 text-xs text-brand-navy outline-none focus:border-brand-blue transition-all"
                  >
                    {dashboards.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">Período</label>
                  <select 
                    value={activePanel === 'A' ? panelA.periodo : panelB.periodo} 
                    onChange={(e) => {
                      const upd = { periodo: e.target.value };
                      if (activePanel === 'A') setPanelA(prev => ({ ...prev, ...upd }));
                      else setPanelB(prev => ({ ...prev, ...upd }));
                    }}
                    className="w-full bg-white border border-brand-border rounded-sm p-1.5 text-xs text-brand-navy outline-none focus:border-brand-blue transition-all"
                  >
                    <option value="All">Todos (2026)</option>
                    <option value="ENERO">Enero</option>
                    <option value="FEBRERO">Febrero</option>
                    <option value="MARZO">Marzo</option>
                    <option value="ABRIL">Abril</option>
                    <option value="MAYO">Mayo</option>
                    <option value="JUNIO">Junio</option>
                    <option value="JULIO">Julio</option>
                    <option value="AGOSTO">Agosto</option>
                    <option value="SEPTIEMBRE">Septiembre</option>
                    <option value="OCTUBRE">Octubre</option>
                    <option value="NOVIEMBRE">Noviembre</option>
                    <option value="DICIEMBRE">Diciembre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">Provincia</label>
                  <select 
                    value={activePanel === 'A' ? panelA.provincia : panelB.provincia} 
                    onChange={(e) => {
                      const upd = { provincia: e.target.value };
                      if (activePanel === 'A') setPanelA(prev => ({ ...prev, ...upd }));
                      else setPanelB(prev => ({ ...prev, ...upd }));
                    }}
                    className="w-full bg-white border border-brand-border rounded-sm p-1.5 text-xs text-brand-navy outline-none focus:border-brand-blue transition-all"
                  >
                    <option value="All">Todas</option>
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">Resultado</label>
                  <select 
                    value={activePanel === 'A' ? panelA.resultado : panelB.resultado} 
                    onChange={(e) => {
                      const upd = { resultado: e.target.value };
                      if (activePanel === 'A') setPanelA(prev => ({ ...prev, ...upd }));
                      else setPanelB(prev => ({ ...prev, ...upd }));
                    }}
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
                    value={activePanel === 'A' ? panelA.investigador : panelB.investigador} 
                    onChange={(e) => {
                      const upd = { investigador: e.target.value };
                      if (activePanel === 'A') setPanelA(prev => ({ ...prev, ...upd }));
                      else setPanelB(prev => ({ ...prev, ...upd }));
                    }}
                    className="w-full bg-white border border-brand-border rounded-sm p-1.5 text-xs text-brand-navy outline-none focus:border-brand-blue transition-all"
                  >
                    <option value="All">Todos</option>
                    {dynamicInvestigators.map(inv => <option key={inv} value={inv}>{inv}</option>)}
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
            </>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto pr-1">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-auto space-y-3"
          >
            {activeTab === 'carga' ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.4 }}
               >
                 {currentView?.type === 'mensual' ? (
                   <div className="bg-white border border-brand-border rounded-sm overflow-hidden shadow-sm">
                      <div className="bg-brand-navy p-3 border-b border-brand-border flex justify-between items-center">
                        <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          <Grid className="w-4 h-4" />
                          {currentView.title} (Carga Directa)
                        </h2>
                        <div className="text-[10px] text-white/70 font-medium italic">
                          * Los cambios impactan en tiempo real en los gráficos
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-[#5c8a37] text-white">
                              <th className="px-3 py-2 border border-white/20 text-left font-bold uppercase tracking-wider">PERIODO</th>
                              <th className="px-3 py-2 border border-white/20 text-right font-bold uppercase tracking-wider">Incurrido (IB)</th>
                              <th className="px-3 py-2 border border-white/20 text-right font-bold uppercase tracking-wider">Plan % Ahorro/IB</th>
                              <th className="px-3 py-2 border border-white/20 text-right font-bold uppercase tracking-wider">Plan</th>
                              <th className="px-3 py-2 border border-white/20 text-right font-bold uppercase tracking-wider">Alcance</th>
                              <th className="px-3 py-2 border border-white/20 text-right font-bold uppercase tracking-wider">Plan % Ahorro/IB2</th>
                              <th className="px-3 py-2 border border-white/20 text-right font-bold uppercase tracking-wider">Tasa de Cumplimiento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {globalData.filter(g => g.tipo === 'Siniestros').map((row) => (
                              <tr key={row.periodo} className="hover:bg-brand-bg transition-colors">
                                <td className="px-3 py-2 border border-brand-border bg-emerald-50/30 font-bold text-brand-navy">
                                  {row.periodo}
                                </td>
                                <td className="px-1 py-1 border border-brand-border">
                                  <input 
                                    type="number" 
                                    value={row.incurridoIB} 
                                    onChange={(e) => updateGlobalValue(row.periodo, row.tipo, 'incurridoIB', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-transparent p-1.5 text-right font-mono outline-none focus:bg-white focus:ring-1 focus:ring-brand-blue"
                                  />
                                </td>
                                <td className="px-1 py-1 border border-brand-border">
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    value={row.planPercentAhorroIB} 
                                    onChange={(e) => updateGlobalValue(row.periodo, row.tipo, 'planPercentAhorroIB', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-transparent p-1.5 text-right font-mono outline-none focus:bg-white focus:ring-1 focus:ring-brand-blue"
                                  />
                                </td>
                                <td className="px-3 py-2 border border-brand-border text-right font-mono bg-brand-bg/30 text-brand-navy">
                                  {formatCurrency(row.plan)}
                                </td>
                                <td className="px-1 py-1 border border-brand-border">
                                  <input 
                                    type="number" 
                                    value={row.ejecutado} 
                                    onChange={(e) => updateGlobalValue(row.periodo, row.tipo, 'ejecutado', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-transparent p-1.5 text-right font-mono outline-none focus:bg-white focus:ring-1 focus:ring-brand-blue"
                                  />
                                </td>
                                <td className="px-3 py-2 border border-brand-border text-right font-mono bg-brand-bg/30 text-brand-navy">
                                  {(row.incurridoIB > 0 ? (row.ejecutado / row.incurridoIB) * 100 : 0).toFixed(1)}%
                                </td>
                                <td className={cn(
                                  "px-3 py-2 border border-brand-border text-right font-bold font-mono bg-brand-bg/30",
                                  row.tasaCumplimiento >= 100 ? "text-emerald-600" : row.tasaCumplimiento > 0 ? "text-rose-500" : "text-brand-gray"
                                )}>
                                  {row.tasaCumplimiento.toFixed(0)}%
                                </td>
                              </tr>
                            ))}
                            {/* Total Row */}
                            {(() => {
                              const s = globalData.filter(g => g.tipo === 'Siniestros');
                              const totalInc = s.reduce((a, b) => a + b.incurridoIB, 0);
                              const totalPlan = s.reduce((a, b) => a + b.plan, 0);
                              const totalExec = s.reduce((a, b) => a + b.ejecutado, 0);
                              return (
                                <tr className="bg-[#d7e4bd] font-bold">
                                  <td className="px-3 py-2 border border-brand-border">TOTAL AÑO</td>
                                  <td className="px-3 py-2 border border-brand-border text-right font-mono">{formatCurrency(totalInc)}</td>
                                  <td className="px-3 py-2 border border-brand-border text-right font-mono">{(totalInc > 0 ? (totalPlan / totalInc) * 100 : 0).toFixed(1)}%</td>
                                  <td className="px-3 py-2 border border-brand-border text-right font-mono">{formatCurrency(totalPlan)}</td>
                                  <td className="px-3 py-2 border border-brand-border text-right font-mono">{formatCurrency(totalExec)}</td>
                                  <td className="px-3 py-2 border border-brand-border text-right font-mono">{(totalInc > 0 ? (totalExec / totalInc) * 100 : 0).toFixed(1)}%</td>
                                  <td className="px-3 py-2 border border-brand-border text-right font-mono">{(totalPlan > 0 ? (totalExec / totalPlan) * 100 : 0).toFixed(0)}%</td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                   </div>
                 ) : (
                   <div className="bg-white border border-brand-border rounded-sm overflow-hidden shadow-sm flex flex-col h-[700px]">
                      <ExcelGrid 
                        rows={currentGranularRows} 
                        onRowsChange={(newRows) => {
                            setGranularDataStore(prev => ({ ...prev, [cargaSubView]: newRows }));
                        }}
                        columns={currentGranularCols}
                        onColumnsChange={(newCols) => {
                            setColumnsDataStore(prev => ({ ...prev, [cargaSubView]: newCols }));
                        }}
                        onPersist={() => {
                          alert('Datos y configuración de columnas guardados exitosamente.');
                        }} 
                      />
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className={cn("flex flex-col lg:flex-row gap-4", isComparisonMode && "items-start overflow-x-auto pb-4")}>
                  <DashboardPane 
                    panelId="A"
                    config={panelA}
                    onConfigChange={setPanelA}
                    globalData={globalData}
                    dashboards={dashboards}
                    granularDataStore={granularDataStore}
                    columnsDataStore={columnsDataStore}
                    activeTab={activeTab}
                    isComparisonMode={isComparisonMode}
                    activePanel={activePanel}
                    setActivePanel={setActivePanel}
                  />
                  {isComparisonMode && (
                    <DashboardPane 
                      panelId="B"
                      config={panelB}
                      onConfigChange={setPanelB}
                      globalData={globalData}
                      dashboards={dashboards}
                      granularDataStore={granularDataStore}
                      columnsDataStore={columnsDataStore}
                      activeTab={activeTab}
                      isComparisonMode={isComparisonMode}
                      activePanel={activePanel}
                      setActivePanel={setActivePanel}
                    />
                  )}
                </div>
        )}
        </motion.div>
      </main>
    </div>
  </div>
);
}

