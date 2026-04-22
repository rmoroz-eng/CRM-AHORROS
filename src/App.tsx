/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { 
  TrendingUp, Users, ShieldCheck, PieChart as PieChartIcon, 
  Filter, Search, ArrowUpRight, ArrowDownRight, 
  FileText, Download, Clock, Database, Plus, Trash2, Save, Grid, LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { ExcelGrid } from '@/src/components/ExcelGrid';
import { 
  GLOBAL_DATA, ACUMULADO_DATA, PROVINCIAS, 
  INVESTIGATORS,
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
    className="group relative bg-white p-4 rounded-sm shadow-none border border-brand-border flex flex-col justify-center min-h-[100px]"
  >
    {/* Tooltip Emergente */}
    <div className="invisible group-hover:visible absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-48 p-2 bg-brand-navy text-white text-[9px] rounded shadow-xl z-50 pointer-events-none transition-all uppercase tracking-wider leading-relaxed">
      {info || "Información del indicador"}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-brand-navy" />
    </div>

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
  // Navigation States
  const [activeTab, setActiveTab] = useState<'siniestros' | 'suscripcion' | 'carga'>('siniestros');
  const [cargaSubView, setCargaSubView] = useState<'mensual' | 'granular'>('mensual');

  // Core Data States (Initialized with mock or persisted data)
  const [globalData, setGlobalData] = useState<GlobalEntry[]>(() => {
    const saved = localStorage.getItem('crm_global_data');
    if (saved) return JSON.parse(saved);
    
    // Expand 3 months to 12 months for both types
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const initial: GlobalEntry[] = [];
    ['Siniestros', 'Suscripción'].forEach(tipo => {
      meses.forEach(mes => {
        const existing = GLOBAL_DATA.find(d => d.periodo === mes && d.tipo === tipo);
        if (existing) {
          initial.push(existing);
        } else {
          initial.push({
            periodo: mes,
            tipo: tipo as any,
            trimestre: mes === 'ENERO' || mes === 'FEBRERO' || mes === 'MARZO' ? 'Q1' : 
                       mes === 'ABRIL' || mes === 'MAYO' || mes === 'JUNIO' ? 'Q2' :
                       mes === 'JULIO' || mes === 'AGOSTO' || mes === 'SEPTIEMBRE' ? 'Q3' : 'Q4',
            proyectado: 0,
            ejecutado: 0,
            incurridoIB: 0,
            plan: 0,
            ejecutadoReal: 0,
            planPercentAhorroIB: 0,
            tasaCumplimiento: 0
          });
        }
      });
    });
    return initial;
  });

  const [acumuladoData, setAcumuladoData] = useState<AccumulatedEntry[]>(() => {
    const saved = localStorage.getItem('crm_acumulado_data');
    return saved ? JSON.parse(saved) : ACUMULADO_DATA;
  });

  const [auditColumns, setAuditColumns] = useState<any[]>(() => {
    const saved = localStorage.getItem('crm_audit_columns');
    return saved ? JSON.parse(saved) : [
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
  });

  // Perspective states
  const [filterPeriodo, setFilterPeriodo] = useState<string>('All');
  const [filterProvincia, setFilterProvincia] = useState<string>('All');
  const [filterResultado, setFilterResultado] = useState<string>('All');
  const [filterInvestigador, setFilterInvestigador] = useState<string>('All');
  const [filterCulpable, setFilterCulpable] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const COLORS = ['#00A1E0', '#FF9D3E', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('crm_global_data', JSON.stringify(globalData));
  }, [globalData]);

  useEffect(() => {
    localStorage.setItem('crm_acumulado_data', JSON.stringify(acumuladoData));
  }, [acumuladoData]);

  useEffect(() => {
    localStorage.setItem('crm_audit_columns', JSON.stringify(auditColumns));
  }, [auditColumns]);

  // Derived Data (Calculated from states)
  const filteredAcumulado = useMemo(() => {
    return acumuladoData.filter(item => {
      const matchPeriodo = filterPeriodo === 'All' || item.periodo === filterPeriodo;
      const matchProvincia = filterProvincia === 'All' || item.provincia === filterProvincia;
      const matchResultado = filterResultado === 'All' || item.resultado === filterResultado;
      const matchInvestigador = filterInvestigador === 'All' || item.investigador === filterInvestigador;
      const matchCulpable = filterCulpable === 'All' || item.culpable === filterCulpable;
      const matchSearch = (item.nroSiniestro?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (item.analista?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchPeriodo && matchProvincia && matchResultado && matchInvestigador && matchCulpable && matchSearch;
    });
  }, [acumuladoData, filterPeriodo, filterProvincia, filterResultado, filterInvestigador, filterCulpable, searchTerm]);

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

  const updateGranularValue = (index: number, field: keyof AccumulatedEntry, value: any) => {
    setAcumuladoData(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addGranularRow = () => {
    const newEntry: AccumulatedEntry = {
      nroSiniestro: `SIN-${20260000 + acumuladoData.length}`,
      fechaSiniestro: '2026-01-01',
      fechaDenuncia: '2026-01-02',
      culpable: 'No',
      provincia: 'Buenos Aires',
      seccion: 'Automotores',
      coverage: 'Automotores',
      poliza: 'POL-NEW',
      productor: 'Productor',
      investigador: 'M. Rodriguez',
      analista: 'Analista',
      estado: 'Abierto',
      resultado: 'Acuerdo',
      periodo: 'ENERO',
      sumaAsegurada: 0,
      ahorro: 0
    };
    setAcumuladoData(prev => [newEntry, ...prev]);
  };

  const deleteGranularRow = (index: number) => {
    if(window.confirm('¿Eliminar este registro?')) {
      setAcumuladoData(prev => prev.filter((_, i) => i !== index));
    }
  };

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
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ global: globalData, acumulado: acumuladoData }));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href",     dataStr);
              downloadAnchorNode.setAttribute("download", "crm_analytics_export.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="flex items-center gap-2 px-3 py-1.5 h-9 bg-brand-blue text-white rounded-sm text-[10px] font-bold hover:opacity-90 transition-all uppercase shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
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
                <button 
                  onClick={() => setCargaSubView('mensual')}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[10px] font-bold uppercase transition-all rounded-sm",
                    cargaSubView === 'mensual' ? "bg-brand-blue text-white shadow-sm" : "text-brand-gray hover:bg-brand-bg"
                  )}
                >
                  Planificación Mensual
                </button>
                <button 
                  onClick={() => setCargaSubView('granular')}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[10px] font-bold uppercase transition-all rounded-sm",
                    cargaSubView === 'granular' ? "bg-brand-blue text-white shadow-sm" : "text-brand-gray hover:bg-brand-bg"
                  )}
                >
                  Registros Granulares
                </button>
              </div>
              <div className="mt-auto border-t border-brand-bg pt-4">
                 <button 
                   onClick={() => {
                     if(window.confirm('¿Desea restablecer todos los datos manuales y configuraciones de columnas?')) {
                       localStorage.removeItem('crm_global_data');
                       localStorage.removeItem('crm_acumulado_data');
                       localStorage.removeItem('crm_audit_columns');
                       window.location.reload();
                     }
                   }}
                   className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-rose-200 text-rose-500 rounded-sm text-[10px] font-bold uppercase hover:bg-rose-50 transition-all"
                 >
                   <Trash2 className="w-3 h-3" />
                   Borrar Datos
                 </button>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto pr-1">
          <div className="mx-auto space-y-3">
            {activeTab === 'carga' ? (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {cargaSubView === 'mensual' ? (
                   <div className="bg-white border border-brand-border rounded-sm overflow-hidden shadow-sm">
                      <div className="bg-brand-navy p-3 border-b border-brand-border flex justify-between items-center">
                        <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          <Grid className="w-4 h-4" />
                          Planificación Mensual (Carga Directa)
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
                        rows={acumuladoData} 
                        onRowsChange={setAcumuladoData}
                        columns={auditColumns}
                        onColumnsChange={setAuditColumns}
                        onPersist={() => {
                          alert('Datos y configuración de columnas guardados exitosamente.');
                        }} 
                      />
                   </div>
                 )}
               </div>
            ) : (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-3">
                 <div id="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <KpiCard 
                id="kpi-ahorro"
                title="Ahorro Total Alcance"
                value={formatCurrency(stats.totalAhorro)}
                subtext="▲ 4.2% vs Proyectado"
                trend={stats.ahorroVsMeta >= 100 ? 'up' : 'down'}
                trendValue={`${stats.ahorroVsMeta.toFixed(1)}%`}
                info="Suma total de ahorros registrados en la grilla de auditoría para el período y filtros seleccionados."
              />
              <KpiCard 
                id="kpi-cumplimiento"
                title="Tasa Cumplimiento"
                value={`${stats.cumplimientoAvg.toFixed(1)}%`}
                subtext="Meta: 92.00%"
                info="Relación porcentual entre los ahorros reales logrados (Alcance) y la meta planificada (Plan) en el presupuesto mensual."
              />
              <KpiCard 
                id="kpi-siniestros"
                title="Siniestros con Ahorro"
                value={stats.uniqueSiniestros.toLocaleString()}
                subtext={`Total período: ${filteredAcumulado.length}`}
                info="Cantidad total de siniestros cerrados que generaron un ahorro positivo en la auditoría."
              />
            </div>

            <div id="visuals-top" className="grid grid-cols-1 gap-3">
               <ChartContainer id="chart-performance" title="Proyectado vs Alcance & Cumplimiento (%)" className="w-full">
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
                    <Bar yAxisId="left" dataKey="Proyectado" fill="#B0ADAB" barSize={30} />
                    <Bar yAxisId="left" dataKey="Alcance" fill="#00A1E0" barSize={30} />
                    <Line yAxisId="right" type="monotone" dataKey="Cumplimiento" stroke="#FF9D3E" strokeWidth={2} dot={{ r: 3, fill: '#FF9D3E' }} />
                  </ComposedChart>
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
                      <th className="px-4 py-2 font-bold text-brand-gray uppercase border-b border-brand-border">Sección</th>
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
                        <td className="px-4 py-2 text-brand-navy">{row.seccion}</td>
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
        )}
        </div>
      </main>
    </div>
  </div>
);
}

