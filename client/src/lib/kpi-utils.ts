import type { KpiData } from '@shared/schema';
import { 
  Calendar, 
  AlertTriangle, 
  ClipboardCheck, 
  Clock, 
  Truck, 
  Hand, 
  Timer, 
  CheckCheck, 
  BarChart3, 
  Target 
} from 'lucide-react';

export const KPI_CONFIG = {
  DOH: {
    icon: Calendar,
    label: 'Dias on Hand',
    description: 'Días de demanda futura que puede cubrir el inventario',
    fullDescription: 'Indica los días de demanda futura que puede cubrir el inventario disponible.'
  },
  DAMAGES: {
    icon: AlertTriangle,
    label: 'Recepciones Con Danos',
    description: 'Porcentaje de unidades dañadas en recepción',
    fullDescription: 'Mide el porcentaje de unidades dañadas durante el proceso de recepción.'
  },
  IRA: {
    icon: ClipboardCheck,
    label: 'IRA',
    description: 'Coincidencia entre registros y conteo físico',
    fullDescription: 'Evalúa la coincidencia entre los registros de inventario y el conteo físico.'
  },
  D2S: {
    icon: Clock,
    label: 'Dock To Stock',
    description: 'Tiempo desde muelle hasta almacenado',
    fullDescription: 'Cuantifica el tiempo transcurrido desde la llegada al muelle hasta que el producto está almacenado y habilitado para picking.'
  },
  OTD: {
    icon: Truck,
    label: 'Despachos On Time',
    description: 'Órdenes despachadas a tiempo',
    fullDescription: 'Refleja la proporción de órdenes despachadas en o antes de la fecha u hora comprometida.'
  },
  PICKING: {
    icon: Hand,
    label: 'Exactitud Picking',
    description: 'Precisión de líneas preparadas',
    fullDescription: 'Mide la precisión de las líneas preparadas respecto a las solicitadas.'
  },
  LEADTIME: {
    icon: Timer,
    label: 'Lead Time Interno',
    description: 'Duración desde liberación hasta listo',
    fullDescription: 'Calcula la duración total desde la liberación de la orden hasta que queda lista para embarque.'
  },
  READYOT: {
    icon: CheckCheck,
    label: 'Ready On Time',
    description: 'Órdenes listas antes del corte',
    fullDescription: 'Indica el porcentaje de órdenes que alcanzan estado «ready» antes del corte operativo.'
  },
  PRODUCTIVITY: {
    icon: BarChart3,
    label: 'Productividad',
    description: 'Unidades despachadas por hora-persona',
    fullDescription: 'Mide la cantidad de unidades o pedidos despachados por hora-persona trabajada.'
  },
  OTIF: {
    icon: Target,
    label: 'OTIF (Entregas a tiempo y completas)',
    description: 'A tiempo y cantidad completa',
    fullDescription: 'Combina puntualidad y completitud para indicar el porcentaje de órdenes entregadas a tiempo y en cantidad completa.',
    tooltip: 'Porcentaje de órdenes que cumplen tanto tiempo de entrega como cantidad completa'
  }
};

export function getKpiStatus(value: number, target: number, kpiCode: string): 'good' | 'warning' | 'critical' {
  const isHigherBetter = ['IRA', 'OTD', 'PICKING', 'READYOT', 'PRODUCTIVITY', 'OTIF'].includes(kpiCode);
  const isLowerBetter = ['DOH', 'DAMAGES', 'D2S', 'LEADTIME'].includes(kpiCode);

  if (isHigherBetter) {
    // OTIF specific thresholds: Green ≥95%, Amber 90-95%, Red <90%
    if (kpiCode === 'OTIF') {
      if (value >= 95) return 'good';
      if (value >= 90) return 'warning';
      return 'critical';
    }
    if (value >= target) return 'good';
    if (value >= target * 0.9) return 'warning';
    return 'critical';
  }

  if (isLowerBetter) {
    if (value <= target) return 'good';
    if (value <= target * 1.2) return 'warning';
    return 'critical';
  }

  return 'good';
}

export function getStatusBadgeProps(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good':
      return {
        className: 'status-good',
        icon: '✓',
        text: 'Bueno'
      };
    case 'warning':
      return {
        className: 'status-warning',
        icon: '⚠',
        text: 'Alerta'
      };
    case 'critical':
      return {
        className: 'status-critical',
        icon: '✕',
        text: 'Crítico'
      };
  }
}

export function getKpiIconStyle(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good':
      return 'kpi-icon-good';
    case 'warning':
      return 'kpi-icon-warning';
    case 'critical':
      return 'kpi-icon-critical';
  }
}

export function formatKpiValue(value: number, unit: string): string {
  if (unit === '%') {
    return `${value.toFixed(1)}%`;
  }
  if (unit === 'días') {
    return `${value.toFixed(1)} d`;
  }
  if (unit === 'horas') {
    return `${value.toFixed(1)} h`;
  }
  if (unit === 'unid/h') {
    return `${Math.round(value)} u/h`;
  }
  return `${value.toFixed(1)} ${unit}`;
}

export function formatKpiValueWithUnit(value: number, unit: string): string {
  if (unit === '%') {
    return `${value.toFixed(1)}%`;
  }
  if (unit === 'días') {
    return `${value.toFixed(1)} días`;
  }
  if (unit === 'horas') {
    return `${value.toFixed(1)} horas`;
  }
  if (unit === 'unid/h') {
    return `${Math.round(value)} unid/h`;
  }
  return `${value.toFixed(1)} ${unit}`;
}

export function formatDelta(delta: number, unit: string): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${formatKpiValue(Math.abs(delta), unit)}`;
}

export function formatDeltaWithTarget(delta: number, target: number, unit: string): string {
  const arrow = delta >= 0 ? '↑' : '↓';
  const formattedDelta = formatKpiValue(Math.abs(delta), unit);
  const formattedTarget = formatKpiValue(target, unit);
  return `${arrow} ${formattedDelta} vs ${formattedTarget}`;
}

export function formatDeltaPercentagePoints(delta: number, target: number, unit: string): string {
  const arrow = delta >= 0 ? '↑' : '↓';
  const formattedDelta = Math.abs(delta).toFixed(1);
  const formattedTarget = target.toFixed(1);
  
  if (unit === '%') {
    return `${arrow} ${formattedDelta} pp vs ${formattedTarget} %`;
  }
  return `${arrow} ${formattedDelta} vs ${formattedTarget}`;
}

export function getDohCriticalMessage(value: number, target: number): string | null {
  if (value > target * 2) {
    return `El inventario actual cubre ${value.toFixed(1)} días de demanda, excediendo el objetivo de ${target} días. Revisar políticas de reabastecimiento.`;
  }
  return null;
}

export function getDamagesCriticalMessage(value: number, target: number): string | null {
  if (value > target) {
    return `El ${value.toFixed(1)} % de las recepciones presentan daños (objetivo ${target.toFixed(1)} %). Revisar embalaje y manejo.`;
  }
  return null;
}

export function getIraCriticalMessage(value: number, target: number): string | null {
  if (value < target * 0.9) {
    return `La precisión de inventario es ${value.toFixed(1)}%, por debajo del objetivo de ${target}%. Implementar auditorías de ciclo más frecuentes.`;
  }
  return null;
}

export function getPickingCriticalMessage(value: number, target: number): string | null {
  // Check if it's no data scenario (value is 0 or very low)
  if (value === 0) {
    return `⏸ Sin datos: No se registraron órdenes pickeadas en el periodo. Verificar actividad operacional.`;
  }
  if (value < target * 0.95) {
    return `⚠️ Exactitud crítica ${value.toFixed(1)}% (objetivo ≥${target}%). Revisar capacitación, procesos y tecnología de picking.`;
  }
  return null;
}

export function getLeadtimeCriticalMessage(value: number, target: number): string | null {
  // Handle invalid data (negative values)
  if (value < 0) {
    return `⚠️ Datos inválidos: Lead time negativo detectado. Verificar timestamps de liberación y completado.`;
  }
  if (value > target * 1.2) {
    return `⏰ Lead time excesivo ${value.toFixed(1)}h (objetivo ≤${target}h). Revisar procesos de preparación y optimizar flujo operacional.`;
  }
  return null;
}

export function getOtdCriticalMessage(value: number, target: number): string | null {
  if (value < target * 0.95) {
    return `Los despachos a tiempo cayeron a ${value.toFixed(1)}% (objetivo ${target}%).`;
  }
  return null;
}

export function getD2sCriticalMessage(value: number, target: number): string | null {
  if (value > target) {
    return `El tiempo Dock-to-Stock es ${value.toFixed(1)}h (objetivo ${target.toFixed(1)}h). Revisar procesos de descarga, inspección y ubicación.`;
  }
  return null;
}

export function getOtifCriticalMessage(value: number, target: number): string | null {
  if (value < 90) {
    return `🚨 OTIF crítico: ${value.toFixed(1)}% por debajo del umbral mínimo del 90%. Revisar procesos de cumplimiento de entrega.`;
  } else if (value < target) {
    return `⚠️ OTIF bajo objetivo: ${value.toFixed(1)}% vs ${target}% meta. Monitorear tendencias de On Time e In Full.`;
  }
  return null;
}
