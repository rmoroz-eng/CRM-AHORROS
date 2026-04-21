import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Limpia campos monetarios que vienen como strings (ejemplo: " $ 24,683,300.00 ")
 * para convertirlos en medidas numéricas operables.
 */
export function cleanCurrency(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  
  // Eliminar símbolos de moneda, espacios y separadores de miles
  // Asumiendo formato Latinoamericano donde la coma es separador de miles y el punto decimal
  // O formato donde el espacio y el signo $ estorban
  const cleaned = val.replace(/[$\s,]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatPercent(val: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(val / 100);
}
