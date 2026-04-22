
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  Plus, Trash2, Settings, Download, Upload, Save,
  Search, AlertCircle, CheckCircle2, ChevronRight,
  MoreVertical, Type, Hash, Calendar, DollarSign,
  Database, FileText
} from 'lucide-react';
import { cn, formatCurrency } from '@/src/lib/utils';

interface ColumnConfig {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'currency';
  required?: boolean;
}

interface ExcelGridProps {
  rows: any[];
  onRowsChange: (rows: any[]) => void;
  columns: ColumnConfig[];
  onColumnsChange: (cols: ColumnConfig[]) => void;
  onPersist?: () => void;
}

export const ExcelGrid: React.FC<ExcelGridProps> = ({ rows, onRowsChange, columns, onColumnsChange, onPersist }) => {
  const [editingCell, setEditingCell] = useState<{ rowIdx: number, colId: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnConfig['type']>('text');

  // Mapping Session State
  const [mappingSession, setMappingSession] = useState<{
    headers: string[];
    data: any[];
    mappings: Record<string, string>; // excelHeader -> targetColId
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws);
        
        if (!jsonData || jsonData.length === 0) {
          alert('El archivo parece estar vacío.');
          return;
        }

        const importedHeaders = Object.keys(jsonData[0]);
        const initialMappings: Record<string, string> = {};
        const unmatchedHeaders: string[] = [];

        importedHeaders.forEach(header => {
          const keyId = header.toLowerCase().trim().replace(/\s+/g, '_');
          const existing = columns.find(c => c.id === keyId || c.name?.toLowerCase() === header.toLowerCase());
          if (existing) {
            initialMappings[header] = existing.id;
          } else {
            unmatchedHeaders.push(header);
          }
        });

        if (unmatchedHeaders.length > 0) {
          setMappingSession({
            headers: importedHeaders,
            data: jsonData,
            mappings: initialMappings
          });
        } else {
          completeImport(jsonData, initialMappings);
        }
      } catch (err) {
        console.error('Excel Import Error:', err);
        alert('Error al procesar el archivo. Asegúrate de que sea un archivo Excel (.xlsx) o CSV válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const completeImport = (jsonData: any[], finalizedMappings: Record<string, string>) => {
    const newCols = [...columns];
    let colsChanged = false;

    // Identify headings that need new columns
    Object.keys(finalizedMappings).forEach(header => {
      const targetId = finalizedMappings[header];
      if (targetId === '__NEW__') {
        const keyId = header.toLowerCase().trim().replace(/\s+/g, '_');
        if (!newCols.find(c => c.id === keyId)) {
          newCols.push({
            id: keyId,
            name: header,
            type: typeof jsonData[0][header] === 'number' ? 'number' : 'text'
          });
          colsChanged = true;
          finalizedMappings[header] = keyId; // Update mapping to the new ID
        } else {
           finalizedMappings[header] = keyId; // Already exists
        }
      }
    });

    if (colsChanged) onColumnsChange(newCols);

    const mappedData = jsonData.map(item => {
      const newItem: any = {};
      Object.keys(item).forEach(header => {
        const targetId = finalizedMappings[header];
        if (targetId && targetId !== '__SKIP__') {
          newItem[targetId] = item[header];
        }
      });
      return newItem;
    });

    onRowsChange([...mappedData, ...rows]);
    setMappingSession(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert(`Importación exitosa: ${mappedData.length} registros cargados.`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const addRow = () => {
    const newRow = columns.reduce((acc, col) => ({ ...acc, [col.id]: col.type === 'number' || col.type === 'currency' ? 0 : '' }), {});
    onRowsChange([newRow, ...rows]);
  };

  const deleteRow = (idx: number) => {
    const newRows = [...rows];
    newRows.splice(idx, 1);
    onRowsChange(newRows);
  };

  const updateCell = (rowIdx: number, colId: string, value: any) => {
    const newRows = [...rows];
    const col = columns.find(c => c.id === colId);
    
    let sanitizedValue = value;
    if (col?.type === 'number' || col?.type === 'currency') {
      sanitizedValue = parseFloat(value) || 0;
    }
    
    newRows[rowIdx] = { ...newRows[rowIdx], [colId]: sanitizedValue };
    onRowsChange(newRows);
  };

  const handleDownload = () => {
    try {
      const doc = new jsPDF();
      doc.text("Reporte de Registros Granulares", 14, 15);
      
      const tableData = rows.map(row => 
        columns.map(col => String(row[col.id] || ''))
      );
      
      (doc as any).autoTable({
        head: [columns.map(c => c.name)],
        body: tableData,
        startY: 20
      });
      
      doc.save("Reporte_Registros_Granulares.pdf");
      console.log("PDF generated successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Error al generar el PDF. Revisa la consola.");
    }
  };

  const addColumn = () => {
    if (!newColName) return;
    const id = newColName.toLowerCase().replace(/\s+/g, '_');
    if (columns.find(c => c.id === id)) return;
    
    onColumnsChange([...columns, { id, name: newColName, type: newColType }]);
    setNewColName('');
    setShowAddColumn(false);
  };

  const validateCell = (rowIdx: number, colId: string): boolean => {
    const val = rows[rowIdx][colId];
    const col = columns.find(c => c.id === colId);
    if (!col) return true;
    
    if (col.type === 'number' || col.type === 'currency') {
      return typeof val === 'number' && !isNaN(val);
    }
    if (col.type === 'date') {
      return !isNaN(Date.parse(val));
    }
    return true;
  };

  const filteredRows = rows.filter(row => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-sm border border-brand-border overflow-hidden">
      {/* Utility Bar */}
      <div className="p-3 border-b border-brand-bg flex items-center justify-between bg-brand-bg/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
            <input 
              type="text" 
              placeholder="Buscar en la grilla..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-brand-border rounded-sm text-xs outline-none focus:ring-1 focus:ring-brand-blue w-64"
            />
          </div>
          <div className="h-4 w-px bg-brand-border mx-1" />
          <div className="flex items-center gap-2">
            <button 
              onClick={addRow}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-navy text-white rounded-sm text-[10px] font-bold uppercase transition-all hover:opacity-90 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Fila
            </button>
            <button 
              onClick={() => setShowAddColumn(!showAddColumn)}
              className="flex items-center gap-2 px-3 py-1.5 border border-brand-border bg-white text-brand-navy rounded-sm text-[10px] font-bold uppercase transition-all hover:bg-brand-bg"
            >
              <Settings className="w-3.5 h-3.5" />
              Columnas
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 border border-brand-navy text-brand-navy rounded-sm text-[10px] font-bold uppercase transition-all hover:bg-brand-navy hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx,.csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 border border-brand-blue text-brand-blue rounded-sm text-[10px] font-bold uppercase transition-all hover:bg-blue-50"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar Excel
          </button>
          <button 
            onClick={() => onPersist?.()}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-blue text-white rounded-sm text-[10px] font-bold uppercase transition-all hover:opacity-90 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Add Column Modal/Inline */}
      {showAddColumn && (
        <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <input 
            type="text" 
            placeholder="Nombre de la nueva columna"
            value={newColName}
            onChange={e => setNewColName(e.target.value)}
            className="px-3 py-1.5 text-xs border border-blue-200 rounded-sm outline-none focus:ring-1 focus:ring-brand-blue flex-1"
          />
          <select 
            value={newColType}
            onChange={e => setNewColType(e.target.value as any)}
            className="px-3 py-1.5 text-xs border border-blue-200 rounded-sm outline-none bg-white"
          >
            <option value="text">Texto</option>
            <option value="number">Número</option>
            <option value="currency">Moneda</option>
            <option value="date">Fecha</option>
          </select>
          <button 
            onClick={addColumn}
            className="px-4 py-1.5 bg-brand-blue text-white rounded-sm text-[10px] font-bold uppercase"
          >
            Confirmar
          </button>
        </div>
      )}

      {/* Dropzone Overlay */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex-1 flex flex-col overflow-hidden",
          isDragging && "bg-blue-50/50 outline-2 outline-dashed outline-brand-blue outline-offset-[-20px]"
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 pointer-events-none animate-in fade-in duration-200">
             <Upload className="w-12 h-12 text-brand-blue mb-4 animate-bounce" />
             <p className="text-sm font-bold text-brand-blue uppercase tracking-widest">Soltar archivo para importar</p>
          </div>
        )}

        <div className="overflow-auto flex-1">
          <table className="w-full text-[10px] border-collapse min-w-[max-content]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-white border-b border-brand-border">
                <th className="px-3 py-2 text-center border-r border-brand-border w-10 sticky left-0 bg-white shadow-[1px_0_0_0_#E8E8E8] z-20">#</th>
                {columns.map(col => (
                  <th key={col.id} className="px-4 py-2 text-left font-bold text-brand-gray uppercase tracking-widest border-r border-brand-border min-w-[120px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        {col.type === 'text' && <Type className="w-3 h-3 opacity-50" />}
                        {col.type === 'number' && <Hash className="w-3 h-3 opacity-50" />}
                        {col.type === 'currency' && <DollarSign className="w-3 h-3 opacity-50" />}
                        {col.type === 'date' && <Calendar className="w-3 h-3 opacity-50" />}
                        {col.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-bg">
              {filteredRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-brand-bg/40 transition-colors group">
                   <td className="px-3 py-2 text-center font-mono text-brand-gray border-r border-brand-border sticky left-0 bg-white group-hover:bg-brand-bg transition-colors z-10 shadow-[1px_0_0_0_#E8E8E8]">
                      {rowIdx + 1}
                   </td>
                   {columns.map(col => {
                     const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colId === col.id;
                     const isInvalid = !validateCell(rowIdx, col.id);
                     
                     return (
                       <td 
                         key={col.id} 
                         onDoubleClick={() => setEditingCell({ rowIdx, colId: col.id })}
                         className={cn(
                           "px-4 py-2 border-r border-brand-border relative transition-colors h-9",
                           isInvalid && "bg-rose-50",
                           isEditing && "bg-white p-0"
                         )}
                       >
                         {isEditing ? (
                           <input 
                             autoFocus
                             type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                             defaultValue={row[col.id]}
                             onBlur={(e) => {
                               updateCell(rowIdx, col.id, e.target.value);
                               setEditingCell(null);
                             }}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 updateCell(rowIdx, col.id, (e.target as any).value);
                                 setEditingCell(null);
                               }
                             }}
                             className="w-full h-full px-4 outline-none ring-2 ring-brand-blue z-30 bg-white"
                           />
                         ) : (
                           <div className="flex items-center justify-between">
                             <span className={cn(
                               "truncate max-w-[150px]",
                               col.type === 'currency' && "font-mono font-semibold"
                             )}>
                               {col.type === 'currency' 
                                 ? formatCurrency(row[col.id] || 0) 
                                 : String(row[col.id] || '')}
                             </span>
                             {isInvalid && (
                               <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                             )}
                           </div>
                         )}
                         
                         {/* Cell Hover Actions */}
                         <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {col.id === 'nroSiniestro' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteRow(rowIdx); }}
                                className="p-1 hover:bg-rose-100 rounded text-rose-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                         </div>
                       </td>
                     );
                   })}
                </tr>
              ))}
              {/* Empty state Row */}
              <tr className="hover:bg-brand-bg/40 cursor-pointer" onClick={addRow}>
                <td className="px-3 py-3 text-center text-brand-blue font-bold border-r border-brand-border sticky left-0 bg-white shadow-[1px_0_0_0_#E8E8E8]">
                  +
                </td>
                <td colSpan={columns.length} className="px-4 py-3 text-brand-gray italic text-[9px] uppercase tracking-widest font-bold">
                   Haz clic para agregar una nueva fila...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Footer */}
      <div className="p-2 border-t border-brand-border bg-brand-bg flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold text-brand-navy uppercase">Total Filas: {rows.length}</span>
          <div className="h-3 w-px bg-brand-border" />
          <span className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
             <CheckCircle2 className="w-3 h-3" />
             Grilla Sincronizada
          </span>
        </div>
        <div className="text-[8px] text-brand-gray uppercase tracking-tighter">
          * Doble clic para editar • Arrastra un Excel para importar
        </div>
      </div>
      {/* Mapping Modal */}
      {mappingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-sm shadow-2xl border border-brand-border w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-4 border-b border-brand-bg bg-brand-navy shrink-0">
                <h3 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Mapeo de Columnas de Importación
                </h3>
                <p className="text-[10px] text-white/70 mt-1 uppercase tracking-tight">Hemos detectado columnas que no coinciden. Elige cómo importarlas.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {mappingSession.headers.map(header => {
                   const currentTarget = mappingSession.mappings[header];
                   const isMatched = columns.some(c => c.id === currentTarget);
                   
                   return (
                     <div key={header} className="flex flex-col gap-1.5 p-3 rounded-sm border border-brand-bg bg-brand-bg/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-brand-gray" />
                            {header}
                          </span>
                          <span className="text-[9px] text-brand-gray font-bold uppercase tracking-widest">Excel Header</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <ChevronRight className="w-3.5 h-3.5 text-brand-blue" />
                          <select 
                            value={mappingSession.mappings[header] || '__NEW__'}
                            onChange={(e) => setMappingSession({
                              ...mappingSession,
                              mappings: { ...mappingSession.mappings, [header]: e.target.value }
                            })}
                            className={cn(
                              "flex-1 bg-white border rounded-sm p-2 text-xs outline-none transition-all",
                              isMatched ? "border-emerald-200 focus:border-emerald-500" : "border-brand-border focus:border-brand-blue"
                            )}
                          >
                            <option value="__NEW__">✨ Crear nueva columna</option>
                            <option value="__SKIP__">🚫 No importar esta columna</option>
                            <optgroup label="Columnas Existentes">
                              {columns.map(col => (
                                <option key={col.id} value={col.id}>{col.name}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                     </div>
                   );
                 })}
              </div>

              <div className="p-4 border-t border-brand-bg bg-brand-bg/50 flex justify-end gap-3 shrink-0">
                 <button 
                   onClick={() => setMappingSession(null)}
                   className="px-4 py-2 text-[10px] font-bold text-brand-gray uppercase hover:text-brand-navy"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={() => completeImport(mappingSession.data, mappingSession.mappings)}
                   className="px-6 py-2 bg-brand-blue text-white rounded-sm text-[10px] font-bold uppercase shadow-sm hover:opacity-90"
                 >
                   Finalizar Importación
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
