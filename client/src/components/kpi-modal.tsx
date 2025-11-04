import React, { useState } from 'react';
import { X, TrendingUp, BarChart3, Table, Download, Info, ChevronDown, ChevronRight, AlertCircle, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ReferenceLine } from 'recharts';
import { useKpiDetail, exportKpiData } from '@/hooks/use-kpis';
import { KPI_CONFIG, getStatusBadgeProps, formatKpiValue, getDohCriticalMessage, getDamagesCriticalMessage, getIraCriticalMessage, getD2sCriticalMessage, getPickingCriticalMessage, getOtdCriticalMessage, getOtifCriticalMessage } from '@/lib/kpi-utils';
import type { KpiData, FilterParams } from '@shared/schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface KpiModalProps {
  kpi: KpiData | null;
  filters: FilterParams;
  isOpen: boolean;
  onClose: () => void;
}

export function KpiModal({ kpi, filters, isOpen, onClose }: KpiModalProps) {
  const [activeTab, setActiveTab] = useState('trend');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [productivityTabs, setProductivityTabs] = useState<Record<string, 'sku' | 'time'>>({});
  const [otifFilter, setOtifFilter] = useState<'todos' | 'tardio' | 'incompleto' | 'ambos'>('todos');
  
  // Initialize productivity tabs to 'sku' by default
  const getActiveTab = (itemId: string) => {
    return productivityTabs[itemId] || 'sku';
  };
  
  const setActiveTabForItem = (itemId: string, tab: 'sku' | 'time') => {
    setProductivityTabs(prev => {
      const newTabs = { ...prev };
      newTabs[itemId] = tab;
      console.log('Setting tab for', itemId, 'to', tab, 'new state:', newTabs);
      return newTabs;
    });
  };
  

  const [showDescription, setShowDescription] = useState(true);
  const detailCacheRef = React.useRef<Map<string, any>>(new Map());
  
  const { data: kpiDetail, isLoading } = useKpiDetail(
    kpi?.code || '',
    filters,
    isOpen && !!kpi
  );

  // Clear cache when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      detailCacheRef.current = new Map();
      setExpandedRows(new Set());
    }
  }, [isOpen]);

  if (!kpi) return null;

  const config = KPI_CONFIG[kpi.code as keyof typeof KPI_CONFIG];
  const statusBadge = getStatusBadgeProps(kpi.status);
  
  // Get critical messages for each KPI
  const getCriticalMessage = () => {
    switch (kpi.code) {
      case 'DOH': return getDohCriticalMessage(kpi.value, kpi.target);
      case 'DAMAGES': return getDamagesCriticalMessage(kpi.value, kpi.target);
      case 'IRA': return getIraCriticalMessage(kpi.value, kpi.target);
      case 'D2S': return getD2sCriticalMessage(kpi.value, kpi.target);
      case 'PICKING': return getPickingCriticalMessage(kpi.value, kpi.target);
      case 'OTD': return getOtdCriticalMessage(kpi.value, kpi.target);
      case 'OTIF': return getOtifCriticalMessage(kpi.value, kpi.target);
      default: return null;
    }
  };
  
  const criticalMessage = getCriticalMessage();

  const handleExport = () => {
    if (kpi) {
      exportKpiData(kpi.code, filters);
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  const getDetailedInfo = (item: any, kpiCode: string) => {
    // Use a consistent cache key based on item properties
    const cacheKey = `${kpiCode}-${item.id}-${item.value}-${item.quantity}-${item.promisedDate}-${item.deliveryDate}`;
    if (detailCacheRef.current.has(cacheKey)) {
      return detailCacheRef.current.get(cacheKey);
    }
    
    const detailInfo = generateDetailedInfo(item, kpiCode);
    detailCacheRef.current.set(cacheKey, detailInfo);
    return detailInfo;
  };

  const renderDetailedTable = (detailInfo: any, kpiCode: string) => {
    if (kpiCode === 'LEADTIME' && detailInfo.leadTimeDetails) {
      return (
        <div className="overflow-x-auto mt-4">
          <h4 className="font-medium text-gray-900 mb-3">Desglose de Tiempos por Etapa</h4>
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium border-b">Etapa</th>
                <th className="text-left py-3 px-4 font-medium border-b">Descripción</th>
                <th className="text-right py-3 px-4 font-medium border-b">Tiempo</th>
                <th className="text-right py-3 px-4 font-medium border-b">% Total</th>
                <th className="text-left py-3 px-4 font-medium border-b">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {detailInfo.leadTimeDetails.map((etapa: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{etapa.icono}</span>
                      <span className="font-medium">{etapa.etapa}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{etapa.descripcion}</td>
                  <td className="py-3 px-4 text-right font-semibold">{etapa.tiempo}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      {etapa.porcentaje}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{etapa.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (kpiCode === 'PICKING' && detailInfo.skuDetails) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium border-b">SKU</th>
                <th className="text-left py-3 px-4 font-medium border-b">Ubicación</th>
                <th className="text-right py-3 px-4 font-medium border-b">Solicitado</th>
                <th className="text-right py-3 px-4 font-medium border-b">Pickeado</th>
                <th className="text-right py-3 px-4 font-medium border-b">Diferencia</th>
                <th className="text-left py-3 px-4 font-medium border-b">Motivo</th>
                <th className="text-center py-3 px-4 font-medium border-b">Estado</th>
              </tr>
            </thead>
            <tbody>
              {detailInfo.skuDetails.map((sku: any, idx: number) => {
                const isExact = sku.pickeado === sku.solicitado;
                const difference = sku.pickeado - sku.solicitado;
                
                return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{sku.sku}</td>
                    <td className="py-3 px-4 text-gray-600">{sku.ubicacion}</td>
                    <td className="py-3 px-4 text-right">{sku.solicitado}</td>
                    <td className="py-3 px-4 text-right">{sku.pickeado}</td>
                    <td className={`py-3 px-4 text-right ${difference !== 0 ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                      <span title={
                        difference === 0 ? 'Picking exacto' :
                        difference > 0 ? `Se pickearon ${Math.abs(difference)} unidades de más` :
                        `Faltaron ${Math.abs(difference)} unidades por pickear`
                      }>
                        {difference === 0 ? '0' : (difference > 0 ? `+${difference}` : difference)}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-left ${sku.error ? 'text-red-600' : 'text-gray-600'}`}>
                      <span className={`px-2 py-1 rounded text-xs ${
                        sku.error 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {sku.motivo || (isExact ? 'Correcto' : 'Error de captura')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={`inline-flex items-center justify-center w-6 h-6 rounded ${
                        isExact ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {isExact ? '✓' : '✖'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    
    if (kpiCode === 'DAMAGES' && detailInfo.damageDetails) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium border-b">SKU</th>
                <th className="text-left py-3 px-4 font-medium border-b">Lote</th>
                <th className="text-right py-3 px-4 font-medium border-b">Recibidas</th>
                <th className="text-right py-3 px-4 font-medium border-b">Dañadas</th>
                <th className="text-right py-3 px-4 font-medium border-b">% Daños</th>
                <th className="text-left py-3 px-4 font-medium border-b">Tipo de Daño</th>
                <th className="text-center py-3 px-4 font-medium border-b">Estado</th>
              </tr>
            </thead>
            <tbody>
              {detailInfo.damageDetails.map((damage: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{damage.sku}</td>
                  <td className="py-3 px-4 text-gray-600">{damage.lote}</td>
                  <td className="py-3 px-4 text-right">{damage.recibidas}</td>
                  <td className="py-3 px-4 text-right font-medium">{damage.danadas}</td>
                  <td className={`py-3 px-4 text-right ${damage.danadas > 0 ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                    {damage.porcentaje}%
                  </td>
                  <td className="py-3 px-4">{damage.tipoDano || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    {damage.danadas > 0 ? <span className="text-red-600">❌</span> : <span className="text-green-600">✅</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    if (kpiCode === 'DOH' && detailInfo.inventoryDetails) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium border-b">SKU</th>
                <th className="text-left py-3 px-4 font-medium border-b">Categoría</th>
                <th className="text-left py-3 px-4 font-medium border-b">Ubicación</th>
                <th className="text-right py-3 px-4 font-medium border-b">Stock</th>
                <th className="text-right py-3 px-4 font-medium border-b">Demanda/Día</th>
                <th className="text-right py-3 px-4 font-medium border-b">Días Cobertura</th>
                <th className="text-center py-3 px-4 font-medium border-b">Estado</th>
              </tr>
            </thead>
            <tbody>
              {detailInfo.inventoryDetails.map((inv: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{inv.sku}</td>
                  <td className="py-3 px-4">{inv.categoria}</td>
                  <td className="py-3 px-4 text-gray-600">{inv.ubicacion}</td>
                  <td className="py-3 px-4 text-right font-medium">{inv.stockActual}</td>
                  <td className="py-3 px-4 text-right">{inv.demandaDiaria}</td>
                  <td className="py-3 px-4 text-right">{inv.diasCobertura}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      inv.estado === 'Crítico' ? 'bg-red-100 text-red-800' :
                      inv.estado === 'Bajo' ? 'bg-yellow-100 text-yellow-800' :
                      inv.estado === 'Exceso' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {inv.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    if (kpiCode === 'IRA' && detailInfo.auditDetails) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium border-b">SKU</th>
                <th className="text-left py-3 px-4 font-medium border-b">Ubicación</th>
                <th className="text-left py-3 px-4 font-medium border-b">Auditor</th>
                <th className="text-right py-3 px-4 font-medium border-b">Sistema</th>
                <th className="text-right py-3 px-4 font-medium border-b">Físico</th>
                <th className="text-right py-3 px-4 font-medium border-b">Diferencia</th>
                <th className="text-right py-3 px-4 font-medium border-b">Precisión</th>
                <th className="text-left py-3 px-4 font-medium border-b">Causa</th>
              </tr>
            </thead>
            <tbody>
              {detailInfo.auditDetails.map((audit: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{audit.sku}</td>
                  <td className="py-3 px-4 text-gray-600">{audit.ubicacion}</td>
                  <td className="py-3 px-4">{audit.auditor}</td>
                  <td className="py-3 px-4 text-right">{audit.sistemaQty}</td>
                  <td className="py-3 px-4 text-right">{audit.fisicoQty}</td>
                  <td className={`py-3 px-4 text-right ${audit.diferencia !== 0 ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                    {audit.diferencia === 0 ? '0' : (audit.fisicoQty > audit.sistemaQty ? `+${audit.diferencia}` : `-${audit.diferencia}`)}
                  </td>
                  <td className="py-3 px-4 text-right">{audit.precision}%</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{audit.causa || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // OTIF specific view with metrics breakdown
    if (kpiCode === 'OTIF' && detailInfo.otifDetails) {
      return (
        <div className="space-y-4">
          {/* OTIF Metrics Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">On Time</div>
              <div className={`text-lg font-semibold ${detailInfo.otifDetails.onTime === 'Sí' ? 'text-green-600' : 'text-red-600'}`}>
                {detailInfo.otifDetails.onTime}
              </div>
              <div className="text-xs text-gray-500">
                Prometido: {detailInfo.otifDetails.fechaPromesa}
              </div>
              <div className="text-xs text-gray-500">
                Entregado: {detailInfo.otifDetails.fechaEntrega}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">In Full</div>
              <div className={`text-lg font-semibold ${detailInfo.otifDetails.inFull === 'Sí' ? 'text-green-600' : 'text-red-600'}`}>
                {detailInfo.otifDetails.inFull}
              </div>
              <div className="text-xs text-gray-500">
                Solicitado: {detailInfo.otifDetails.cantidadSolicitada}
              </div>
              <div className="text-xs text-gray-500">
                Entregado: {detailInfo.otifDetails.cantidadEntregada}
              </div>
            </div>
          </div>

          {/* Overall OTIF Result */}
          <div className={`p-4 rounded-lg border-l-4 ${
            detailInfo.otifDetails.cumplimiento === 100 
              ? 'bg-green-50 border-green-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-semibold ${
                  detailInfo.otifDetails.cumplimiento === 100 ? 'text-green-800' : 'text-red-800'
                }`}>
                  {detailInfo.otifDetails.cumplimiento === 100 ? 'OTIF Cumplido' : 'OTIF Fallido'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Orden: {detailInfo.otifDetails.orderId}
                </div>
              </div>
              <div className={`text-2xl font-bold ${
                detailInfo.otifDetails.cumplimiento === 100 ? 'text-green-600' : 'text-red-600'
              }`}>
                {detailInfo.otifDetails.cumplimiento}%
              </div>
            </div>
          </div>

          {/* Failure Analysis if applicable */}
          {detailInfo.otifDetails.cumplimiento !== 100 && detailInfo.notes && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <div className="text-sm font-medium text-blue-800 mb-1">Análisis de Falla:</div>
              <p className="text-sm text-blue-700">{detailInfo.notes}</p>
            </div>
          )}
        </div>
      );
    }
    
    if (kpiCode === 'D2S' && detailInfo.d2sDetails) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium border-b">Etapa</th>
                <th className="text-center py-3 px-4 font-medium border-b">Icono</th>
                <th className="text-right py-3 px-4 font-medium border-b">Tiempo</th>
                <th className="text-left py-3 px-4 font-medium border-b">Responsable</th>
                <th className="text-center py-3 px-4 font-medium border-b">Estado</th>
              </tr>
            </thead>
            <tbody>
              {detailInfo.d2sDetails.map((etapa: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{etapa.etapa}</td>
                  <td className="py-3 px-4 text-center text-lg">{etapa.icono}</td>
                  <td className="py-3 px-4 text-right font-semibold">{etapa.tiempo}</td>
                  <td className="py-3 px-4 text-gray-600">{etapa.responsable}</td>
                  <td className="py-3 px-4 text-center">
                    {etapa.estado === 'completed' ? (
                      <span className="text-green-600 text-lg">✓</span>
                    ) : etapa.estado === 'warning' ? (
                      <span className="text-yellow-600 text-lg">⚠️</span>
                    ) : (
                      <span className="text-red-600 text-lg">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Default timeline view for other KPIs
    return (
      <div className="space-y-2">
        {detailInfo.steps.map((step: any, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm text-gray-500 min-w-[50px]">{step.time}</span>
            <div className={`w-2 h-2 rounded-full ${
              step.status === 'completed' ? 'bg-green-500' : 
              step.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-700">{step.action}</span>
          </div>
        ))}
      </div>
    );
  };

  const generateDetailedInfo = (item: any, kpiCode: string) => {
    switch (kpiCode) {
      case 'DOH': {
        // Generate specific details for THIS SKU only
        const skuPrincipal = item.orderId || `SKU-${item.id.split('-')[2]}`;
        const stockActual = item.quantity;
        const diasCobertura = item.value;
        const demandaDiaria = Math.round(stockActual / diasCobertura);
        const ubicacion = `A${Math.floor(Math.random() * 20) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 5) + 1}`;
        const categoria = ['Electrónicos', 'Ropa', 'Hogar', 'Deportes', 'Juguetes'][Math.floor(Math.random() * 5)];
        
        // Generate historical movement for the last 7 days
        const movimientos = [];
        const fechaActual = new Date();
        
        for (let i = 0; i < 7; i++) {
          const fecha = new Date(fechaActual);
          fecha.setDate(fecha.getDate() - i);
          
          const entradas = i === 0 ? 0 : Math.floor(Math.random() * 50);
          const salidas = Math.floor(Math.random() * demandaDiaria * 0.5 + demandaDiaria * 0.75);
          const stockDia = Math.max(0, stockActual - (salidas * i));
          
          movimientos.push({
            fecha: fecha.toLocaleDateString(),
            entradas,
            salidas,
            stockFinal: stockDia,
            cobertura: Math.floor(stockDia / Math.max(demandaDiaria, 1))
          });
        }
        
        let estado = 'Normal';
        if (diasCobertura < 7) estado = 'Crítico';
        else if (diasCobertura < 15) estado = 'Bajo';
        else if (diasCobertura > 45) estado = 'Exceso';
        
        const analista = `Analista-${Math.floor(Math.random() * 5) + 1}`;
        
        return {
          steps: [
            { time: '08:00', action: `Análisis DOH para ${skuPrincipal}`, status: 'completed' },
            { time: '08:10', action: `Stock actual: ${stockActual} unidades`, status: 'completed' },
            { time: '08:20', action: `Demanda diaria: ${demandaDiaria} unidades`, status: 'completed' },
            { time: '08:30', action: `Cobertura: ${diasCobertura} días (${estado})`, status: estado === 'Crítico' ? 'error' : estado === 'Bajo' ? 'warning' : 'completed' }
          ],
          inventoryDetails: [{
            sku: skuPrincipal,
            categoria,
            ubicacion,
            stockActual,
            demandaDiaria,
            diasCobertura,
            estado,
            movimientos
          }],
          notes: `SKU: ${skuPrincipal} | Stock: ${stockActual} unidades | Demanda: ${demandaDiaria}/día | Cobertura: ${diasCobertura} días | Estado: ${estado}`
        };
      }
      
      case 'DAMAGES': {
        const unidadesRecibidas = item.quantity || Math.floor(Math.random() * 200) + 50;
        const porcentajeDanos = item.value;
        const unidadesDanadas = Math.floor(porcentajeDanos * unidadesRecibidas / 100);
        const skusRecibidos = [
          'SKU-FRA001', 'SKU-ELE089', 'SKU-GLA234', 'SKU-TXT567', 'SKU-MET123',
          'SKU-PLT456', 'SKU-CER789', 'SKU-PAP012', 'SKU-BOX345', 'SKU-LIQ678'
        ];
        
        const damageDetails = [];
        let totalDanadas = 0;
        let totalRecibidas = 0;
        const numSkus = Math.min(5, Math.floor(Math.random() * 3) + 3);
        
        for (let i = 0; i < numSkus; i++) {
          const sku = skusRecibidos[Math.floor(Math.random() * skusRecibidos.length)];
          const recibidas = Math.floor(Math.random() * 50) + 10;
          const hasDamage = Math.random() < 0.3; // 30% chance of damage
          const danadas = hasDamage ? Math.floor(Math.random() * Math.min(recibidas * 0.1, 5)) + 1 : 0;
          const tiposDano = ['Aplastamiento', 'Humedad', 'Rotura', 'Rayones', 'Deformación', 'Manchas'];
          const tipoDano = hasDamage ? tiposDano[Math.floor(Math.random() * tiposDano.length)] : '';
          const lote = `LT${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
          
          totalRecibidas += recibidas;
          totalDanadas += danadas;
          
          damageDetails.push({
            sku,
            lote,
            recibidas,
            danadas,
            tipoDano,
            porcentaje: ((danadas / recibidas) * 100).toFixed(1)
          });
        }
        
        const inspector = `Inspector-${Math.floor(Math.random() * 8) + 1}`;
        const proveedor = ['Proveedor Alpha', 'Beta Logistics', 'Gamma Supply', 'Delta Corp'][Math.floor(Math.random() * 4)];
        
        return {
          steps: [
            { time: '09:00', action: `Recepción orden: ${item.orderId} de ${proveedor}`, status: 'completed' },
            { time: '09:15', action: `Inspector ${inspector} inicia revisión de ${numSkus} SKUs`, status: 'completed' },
            { time: '09:30', action: `Inspección completada: ${totalDanadas}/${totalRecibidas} unidades dañadas`, status: totalDanadas > 0 ? 'warning' : 'completed' },
            { time: '09:45', action: `Reporte de daños generado - ${damageDetails.filter(d => d.danadas > 0).length} SKUs afectados`, status: totalDanadas > totalRecibidas * 0.02 ? 'error' : 'completed' }
          ],
          damageDetails: damageDetails,
          notes: `Inspector: ${inspector} | Proveedor: ${proveedor} | Total inspeccionado: ${totalRecibidas} unidades | Dañadas: ${totalDanadas} unidades | Tasa: ${((totalDanadas/totalRecibidas)*100).toFixed(1)}% vs objetivo 2%.`
        };
      }

      case 'IRA': {
        const skusAuditoria = [
          'SKU-AUD001', 'SKU-INV089', 'SKU-CHK234', 'SKU-CNT567', 'SKU-VER123',
          'SKU-STK456', 'SKU-QTY789', 'SKU-LOC012', 'SKU-BIN345', 'SKU-ZON678'
        ];
        
        const auditDetails = [];
        let totalSistema = 0;
        let totalFisico = 0;
        let totalDiferencias = 0;
        const numSkus = Math.min(5, Math.floor(Math.random() * 3) + 3);
        
        for (let i = 0; i < numSkus; i++) {
          const sku = skusAuditoria[Math.floor(Math.random() * skusAuditoria.length)];
          const sistemaQty = Math.floor(Math.random() * 150) + 20;
          const hasDiscrepancy = Math.random() < 0.25; // 25% chance of discrepancy
          const adjustment = hasDiscrepancy ? Math.floor((Math.random() - 0.5) * 10) : 0;
          const fisicoQty = sistemaQty + adjustment;
          const diferencia = Math.abs(sistemaQty - fisicoQty);
          const ubicacion = `A${Math.floor(Math.random() * 20) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 5) + 1}`;
          const auditor = `Auditor-${Math.floor(Math.random() * 6) + 1}`;
          
          let causa = '';
          if (hasDiscrepancy) {
            const causas = ['Producto mal ubicado', 'Error en recepción', 'Movimiento no registrado', 'Merma no reportada', 'Error de captura'];
            causa = causas[Math.floor(Math.random() * causas.length)];
          }
          
          totalSistema += sistemaQty;
          totalFisico += Math.max(0, fisicoQty);
          totalDiferencias += diferencia;
          
          auditDetails.push({
            sku,
            ubicacion,
            auditor,
            sistemaQty,
            fisicoQty: Math.max(0, fisicoQty),
            diferencia,
            causa,
            precision: diferencia === 0 ? 100 : ((Math.min(sistemaQty, fisicoQty) / Math.max(sistemaQty, fisicoQty)) * 100).toFixed(1)
          });
        }
        
        const supervisor = `Supervisor-${Math.floor(Math.random() * 4) + 1}`;
        const fechaAuditoria = new Date().toLocaleDateString();
        
        return {
          steps: [
            { time: '16:00', action: `Auditoría iniciada por ${supervisor}`, status: 'completed' },
            { time: '16:15', action: `${numSkus} SKUs asignados para conteo físico`, status: 'completed' },
            { time: '16:30', action: `Conteos completados - ${auditDetails.filter(a => a.diferencia === 0).length}/${numSkus} exactos`, status: auditDetails.some(a => a.diferencia > 2) ? 'warning' : 'completed' },
            { time: '16:45', action: `Ajustes requeridos: ${auditDetails.filter(a => a.diferencia > 0).length} SKUs`, status: auditDetails.filter(a => a.diferencia > 2).length > 0 ? 'error' : 'completed' }
          ],
          auditDetails: auditDetails,
          notes: `Supervisor: ${supervisor} | Fecha: ${fechaAuditoria} | Precisión total: ${((totalFisico/totalSistema)*100).toFixed(1)}% | Total diferencias: ${totalDiferencias} unidades | SKUs con discrepancias: ${auditDetails.filter(a => a.diferencia > 0).length}`
        };
      }

      case 'PICKING': {
        const exactitud = ((item.value / item.quantity) * 100).toFixed(1);
        const picker = `Operario-${Math.floor(Math.random() * 20) + 1}`;
        const zona = ['Zona A', 'Zona B', 'Zona C'][Math.floor(Math.random() * 3)];
        
        // Use actual quantities from the summary to ensure consistency
        const totalSolicitadoSummary = item.quantity;
        const totalPickeadoSummary = item.value;
        const diferenciaTotalSummary = totalPickeadoSummary - totalSolicitadoSummary;
        
        // Generate specific SKU details for picking that add up to summary
        const skus = [
          'SKU-ELE001', 'SKU-CLO042', 'SKU-BOO123', 'SKU-TOY067', 'SKU-HOM089', 
          'SKU-SPO034', 'SKU-AUT156', 'SKU-GAR078', 'SKU-PET099', 'SKU-OFF234'
        ];
        
        const skuDetails = [];
        let totalSolicitado = 0;
        let totalPickeado = 0;
        const numSkus = Math.min(4, Math.floor(Math.random() * 3) + 2);
        
        // First, distribute the total quantities among SKUs
        const solicitadoPorSku = [];
        let remaining = totalSolicitadoSummary;
        
        for (let i = 0; i < numSkus - 1; i++) {
          const cantidad = Math.floor(Math.random() * Math.min(remaining / 2, 20)) + 5;
          solicitadoPorSku.push(cantidad);
          remaining -= cantidad;
        }
        solicitadoPorSku.push(Math.max(1, remaining)); // Last SKU gets remaining
        
        // Now distribute the difference among SKUs
        let diferenciaRestante = diferenciaTotalSummary;
        
        for (let i = 0; i < numSkus; i++) {
          const sku = skus[Math.floor(Math.random() * skus.length)];
          const solicitado = solicitadoPorSku[i];
          let pickeado;
          let motivo;
          
          // Apply difference to this SKU if there's still difference to distribute
          if (i === numSkus - 1) {
            // Last SKU gets any remaining difference
            pickeado = solicitado + diferenciaRestante;
          } else if (diferenciaRestante !== 0 && Math.random() < 0.3) {
            // 30% chance to apply part of the difference to this SKU
            const diferenciaParcial = Math.min(Math.abs(diferenciaRestante), Math.floor(Math.random() * 3) + 1);
            const signo = diferenciaRestante > 0 ? 1 : -1;
            pickeado = solicitado + (diferenciaParcial * signo);
            diferenciaRestante -= (diferenciaParcial * signo);
          } else {
            pickeado = solicitado;
          }
          
          // Ensure pickeado is not negative
          pickeado = Math.max(0, pickeado);
          
          // Determine motivo based on whether there's a difference
          if (pickeado === solicitado) {
            motivo = 'Correcto';
          } else if (pickeado < solicitado) {
            const motivos = ['Producto en mal estado', 'Rotura en el empaque', 'Vencido', 'Stock insuficiente'];
            motivo = motivos[Math.floor(Math.random() * motivos.length)];
          } else {
            const motivos = ['Error en el conteo', 'Ubicación incorrecta', 'Doble picking'];
            motivo = motivos[Math.floor(Math.random() * motivos.length)];
          }
          
          const ubicacion = `${zona} C-${Math.floor(Math.random() * 20) + 1}-${Math.floor(Math.random() * 10) + 1}`;
          
          totalSolicitado += solicitado;
          totalPickeado += pickeado;
          
          skuDetails.push({
            sku,
            ubicacion,
            solicitado,
            pickeado,
            diferencia: pickeado - solicitado,
            motivo,
            error: pickeado !== solicitado
          });
        }
        
        // Verification: ensure totals match summary
        console.log(`PICKING Debug - Summary: ${totalSolicitadoSummary}/${totalPickeadoSummary}, Details: ${totalSolicitado}/${totalPickeado}`);
        
        return {
          steps: [
            { time: '10:00', action: `Orden asignada a ${picker} en ${zona}`, status: 'completed' },
            { time: '10:15', action: `Picking iniciado - ${numSkus} líneas`, status: 'completed' },
            { time: '10:45', action: `Picking completado - ${skuDetails.filter(s => !s.error).length}/${numSkus} líneas exactas`, status: skuDetails.some(s => s.error) ? 'warning' : 'completed' },
            { time: '11:00', action: `Validación final - ${exactitud}% exactitud`, status: parseFloat(exactitud) >= 98 ? 'completed' : 'error' }
          ],
          skuDetails: skuDetails,
          notes: `Picker: ${picker} | Zona: ${zona} | Exactitud: ${exactitud}% | Total solicitado: ${totalSolicitado} | Total pickeado: ${totalPickeado} | Diferencia: ${totalPickeado - totalSolicitado}`
        };
      }

      case 'LEADTIME': {
        const leadTimeTotal = item.value;
        const procesamiento = (leadTimeTotal * 0.4).toFixed(1);
        const esperaRecursos = (leadTimeTotal * 0.25).toFixed(1);
        const control = (leadTimeTotal * 0.2).toFixed(1);
        const transporte = (leadTimeTotal * 0.15).toFixed(1);
        const operario = `Operario-LT-${Math.floor(Math.random() * 15) + 1}`;
        const supervisor = `Supervisor-${Math.floor(Math.random() * 6) + 1}`;
        const prioridad = ['Normal', 'Alta', 'Urgente'][Math.floor(Math.random() * 3)];
        
        const leadTimeDetails = [
          {
            etapa: 'Procesamiento',
            icono: '⚙️',
            tiempo: `${procesamiento}h`,
            descripcion: 'Tiempo activo de procesamiento',
            responsable: operario,
            porcentaje: (parseFloat(procesamiento) / leadTimeTotal * 100).toFixed(1)
          },
          {
            etapa: 'Espera de Recursos',
            icono: '⏳',
            tiempo: `${esperaRecursos}h`,
            descripcion: 'Tiempo esperando materiales/personal',
            responsable: supervisor,
            porcentaje: (parseFloat(esperaRecursos) / leadTimeTotal * 100).toFixed(1)
          },
          {
            etapa: 'Control de Calidad',
            icono: '🔍',
            tiempo: `${control}h`,
            descripcion: 'Inspección y validación',
            responsable: `QC-${Math.floor(Math.random() * 5) + 1}`,
            porcentaje: (parseFloat(control) / leadTimeTotal * 100).toFixed(1)
          },
          {
            etapa: 'Transporte Interno',
            icono: '🚛',
            tiempo: `${transporte}h`,
            descripcion: 'Movimientos internos',
            responsable: `Transp-${Math.floor(Math.random() * 8) + 1}`,
            porcentaje: (parseFloat(transporte) / leadTimeTotal * 100).toFixed(1)
          }
        ];
        
        return {
          steps: [
            { time: '08:00', action: `Orden ${item.orderId} asignada (Prioridad: ${prioridad})`, status: 'completed' },
            { time: '08:30', action: `Iniciado procesamiento - ${operario}`, status: 'completed' },
            { time: `${(8 + parseFloat(procesamiento)).toFixed(0)}:00`, action: `Procesamiento completado`, status: 'completed' },
            { time: `${(8 + leadTimeTotal).toFixed(0)}:00`, action: `Lead time total: ${leadTimeTotal.toFixed(1)}h`, status: leadTimeTotal <= 48 ? 'completed' : 'warning' }
          ],
          leadTimeDetails: leadTimeDetails,
          notes: `Lead Time: ${leadTimeTotal.toFixed(1)}h | Prioridad: ${prioridad} | Responsable: ${operario} | Supervisor: ${supervisor} | ${leadTimeTotal <= 48 ? 'Dentro del objetivo' : `Excede objetivo por ${(leadTimeTotal - 48).toFixed(1)}h`}`
        };
      }

      case 'D2S': {
        const tiempoTotal = item.value;
        const tiempoDescarga = Math.floor(tiempoTotal * 0.25 + Math.random() * 0.5);
        const tiempoInspeccion = Math.floor(tiempoTotal * 0.35 + Math.random() * 0.3);
        const tiempoUbicacion = Math.floor(tiempoTotal * 0.25 + Math.random() * 0.3);
        const tiempoStock = tiempoTotal - tiempoDescarga - tiempoInspeccion - tiempoUbicacion;
        const transportista = ['FedEx', 'DHL', 'UPS', 'Local Transport'][Math.floor(Math.random() * 4)];
        const operario = `Operario-D2S-${Math.floor(Math.random() * 12) + 1}`;
        const supervisor = `Supervisor-${Math.floor(Math.random() * 5) + 1}`;
        
        const d2sDetails = [
          {
            etapa: 'Descarga',
            icono: '🚚',
            tiempo: `${tiempoDescarga.toFixed(1)}h`,
            responsable: operario,
            estado: tiempoDescarga > 1.5 ? 'warning' : 'completed'
          },
          {
            etapa: 'Inspección',
            icono: '🔍',
            tiempo: `${tiempoInspeccion.toFixed(1)}h`,
            responsable: `Inspector-${Math.floor(Math.random() * 6) + 1}`,
            estado: tiempoInspeccion > 1.5 ? 'warning' : 'completed'
          },
          {
            etapa: 'Ubicación',
            icono: '⬇️',
            tiempo: `${tiempoUbicacion.toFixed(1)}h`,
            responsable: operario,
            estado: tiempoUbicacion > 1.0 ? 'warning' : 'completed'
          },
          {
            etapa: 'Stock',
            icono: '📦',
            tiempo: `${tiempoStock.toFixed(1)}h`,
            responsable: supervisor,
            estado: tiempoTotal > 4 ? 'critical' : tiempoTotal > 3 ? 'warning' : 'completed'
          }
        ];
        
        return {
          steps: [
            { time: '08:00', action: `🚚 Llegada camión ${transportista} - Orden: ${item.orderId}`, status: 'completed' },
            { time: `08:${Math.floor(tiempoDescarga * 60).toString().padStart(2, '0')}`, action: `⬇️ Descarga completada: ${tiempoDescarga.toFixed(1)}h`, status: tiempoDescarga > 1.5 ? 'warning' : 'completed' },
            { time: `${8 + Math.floor(tiempoDescarga + tiempoInspeccion)}:${Math.floor(((tiempoDescarga + tiempoInspeccion) % 1) * 60).toString().padStart(2, '0')}`, action: `🔍 Inspección completada: ${tiempoInspeccion.toFixed(1)}h`, status: tiempoInspeccion > 1.5 ? 'warning' : 'completed' },
            { time: `${8 + Math.floor(tiempoTotal)}:${Math.floor((tiempoTotal % 1) * 60).toString().padStart(2, '0')}`, action: `📦 Producto en stock: ${tiempoTotal.toFixed(1)}h total`, status: tiempoTotal > 4 ? 'error' : 'completed' }
          ],
          d2sDetails: d2sDetails,
          notes: `Supervisor: ${supervisor} | ${new Date().toLocaleDateString()} | Tiempo total: ${tiempoTotal.toFixed(1)}h | Objetivo: 4.0h | Total diferencias: ${Math.abs(tiempoTotal - 4).toFixed(1)}h`
        };
      }

      case 'OTD': {
        const fechaPromesa = new Date(item.promisedDate || '2025-06-20');
        const fechaEntrega = new Date(item.deliveryDate || '2025-06-22');
        const diasRetraso = Math.ceil((fechaEntrega.getTime() - fechaPromesa.getTime()) / (1000 * 60 * 60 * 24));
        const courier = ['Express', 'Standard', 'Priority', 'Same Day'][Math.floor(Math.random() * 4)];
        const motivo = diasRetraso > 0 ? ['Retraso en picking', 'Problema transporte', 'Documentación', 'Clima adverso'][Math.floor(Math.random() * 4)] : 'Entrega puntual';
        return {
          steps: [
            { time: '09:00', action: `Orden: ${item.orderId} - Servicio: ${courier}`, status: 'completed' },
            { time: '10:30', action: `Fecha prometida: ${fechaPromesa.toLocaleDateString()}`, status: 'completed' },
            { time: '14:00', action: `Fecha entrega real: ${fechaEntrega.toLocaleDateString()}`, status: diasRetraso <= 0 ? 'completed' : 'error' },
            { time: '16:00', action: diasRetraso <= 0 ? 'Entrega a tiempo' : `Retraso: ${diasRetraso} días - ${motivo}`, status: diasRetraso <= 0 ? 'completed' : 'error' }
          ],
          notes: `Análisis de entrega: Prometido ${fechaPromesa.toLocaleDateString()}, entregado ${fechaEntrega.toLocaleDateString()}. ${diasRetraso <= 0 ? `Entrega puntual (+${Math.abs(diasRetraso)} días de ventaja)` : `Retraso de ${diasRetraso} días por ${motivo}`}. Objetivo: 95% entregas a tiempo.`
        };
      }

      case 'READYOT': {
        const horaCorte = '15:00';
        const isOnTime = item.value >= 90;
        const isNoData = item.value === 0;
        
        if (isNoData) {
          return {
            steps: [
              { time: '08:00', action: `Orden: ${item.orderId} programada para corte ${horaCorte}`, status: 'completed' },
              { time: '10:00', action: 'Picking iniciado', status: 'warning' },
              { time: '--:--', action: 'Proceso no completado', status: 'error' }
            ],
            notes: `Orden no alcanzó el estado 'ready' para ningún corte operativo. Revisar impedimentos operacionales.`
          };
        }
        
        const horaCompletado = isOnTime ? '14:36' : '15:24';
        const tiempoAntes = isOnTime ? 0.4 : -0.4;
        const supervisor = `Supervisor-${Math.floor(Math.random() * 5) + 1}`;
        
        return {
          steps: [
            { time: '08:00', action: `Orden: ${item.orderId} programada para corte ${horaCorte}`, status: 'completed' },
            { time: '10:00', action: `Picking iniciado - ${supervisor}`, status: 'completed' },
            { time: '12:30', action: `Empaque y etiquetado completado`, status: 'completed' },
            { time: horaCompletado, action: isOnTime ? `Listo antes del corte (${Math.abs(tiempoAntes)}h antes)` : `Completado después del corte (${Math.abs(tiempoAntes)}h después)`, status: isOnTime ? 'completed' : 'warning' }
          ],
          notes: `Preparación de orden: Corte programado ${horaCorte}, completado ${horaCompletado}. Orden ${isOnTime ? `estuvo lista ${Math.abs(tiempoAntes)} horas antes` : `no estuvo lista para`} del corte programado. Supervisor: ${supervisor}.`
        };
      }

      case 'PRODUCTIVITY': {
        // Use a seed based on item.id to ensure consistent data
        const seed = item.id.split('-').pop() || '1000';
        const seedNum = parseInt(seed) || 1000;
        
        // Seeded random function for consistent results
        const seededRandom = (index: number) => {
          const x = Math.sin(seedNum + index) * 10000;
          return x - Math.floor(x);
        };
        
        // Calculate consistent work hours and total units based on original productivity
        const productividadOriginal = item.value || 150; // u/h from backend
        const workHours = Math.max(6, Math.floor(seededRandom(5) * 3) + 7); // 7-9 hours
        const totalUnidadesTarget = Math.floor(productividadOriginal * workHours); // Target total units
        
        // Generate detailed SKU breakdown that adds up to target
        const numSkus = Math.floor(seededRandom(1) * 4) + 5; // 5-8 SKUs
        const skuList = [];
        let remainingUnits = totalUnidadesTarget;
        
        for (let i = 0; i < numSkus; i++) {
          // Distribute units proportionally, with last SKU getting remainder
          const isLast = i === numSkus - 1;
          const proportion = isLast ? 1.0 : (seededRandom(i + 10) * 0.3 + 0.1); // 10-40% per SKU
          const cantidadProcesada = isLast ? remainingUnits : Math.floor(remainingUnits * proportion);
          remainingUnits -= cantidadProcesada;
          
          const cantidadSolicitada = Math.floor(cantidadProcesada * (0.95 + seededRandom(i + 20) * 0.1)); // 95-105% of processed
          
          let status = 'Correcto';
          if (cantidadProcesada < cantidadSolicitada) status = 'Faltante';
          else if (cantidadProcesada > cantidadSolicitada) status = 'Exceso';
          
          skuList.push({
            sku: `SKU-${String(Math.floor(seededRandom(i + 30) * 9000) + 1000)}`,
            descripcion: `Producto ${String.fromCharCode(65 + i)} ${Math.floor(seededRandom(i + 40) * 100)}`,
            ubicacion: `${String.fromCharCode(65 + Math.floor(seededRandom(i + 50) * 6))}-${Math.floor(seededRandom(i + 60) * 20) + 1}-${Math.floor(seededRandom(i + 70) * 10) + 1}`,
            cantidadProcesada: Math.max(1, cantidadProcesada), // Ensure at least 1 unit
            cantidadSolicitada,
            status
          });
        }
        
        // Generate time blocks that distribute the total units across work hours
        const timeBlocks = [];
        const startHour = 8;
        let remainingUnitsForBlocks = totalUnidadesTarget;
        
        for (let i = 0; i < workHours; i++) {
          const hour = startHour + i;
          const isLast = i === workHours - 1;
          const unidades = isLast ? remainingUnitsForBlocks : Math.floor(remainingUnitsForBlocks * (seededRandom(i + 80) * 0.3 + 0.1));
          remainingUnitsForBlocks -= unidades;
          
          timeBlocks.push({
            bloque: `${hour}:00 - ${hour + 1}:00`,
            unidades: Math.max(1, unidades)
          });
        }
        
        const totalUnidades = skuList.reduce((sum, sku) => sum + sku.cantidadProcesada, 0);
        const horasTrabajadas = workHours;
        const productividadCalculada = totalUnidades / horasTrabajadas;
        
        const operario = `Operario-${Math.floor(seededRandom(100) * 15) + 1}`;
        const turno = horasTrabajadas <= 4 ? 'Matutino' : horasTrabajadas <= 8 ? 'Vespertino' : 'Nocturno';
        
        return {
          skuDetails: skuList,
          timeBlocks,
          summary: {
            totalUnidades,
            horasTrabajadas,
            productividadCalculada: Number(productividadCalculada.toFixed(1)),
            meta: 160,
            cumplimiento: Number(((productividadCalculada / 160) * 100).toFixed(1))
          },
          steps: [
            { time: '07:00', action: `${operario} - Turno ${turno} iniciado`, status: 'completed' },
            { time: '09:00', action: `Primer bloque: ${Math.floor(totalUnidades * 0.3)} unidades`, status: 'completed' },
            { time: '12:00', action: `Segundo bloque: ${Math.floor(totalUnidades * 0.4)} unidades`, status: 'completed' },
            { time: '15:00', action: `Total procesado: ${totalUnidades} unidades en ${horasTrabajadas}h`, status: productividadCalculada >= 100 ? 'completed' : 'warning' }
          ],
          notes: `Productividad ${operario}: ${totalUnidades} unidades en ${horasTrabajadas} horas = ${productividadCalculada.toFixed(1)} unid/hr. Turno: ${turno}. ${productividadCalculada >= 160 ? 'Superó la meta de 160 unid/hr' : 'No alcanzó la meta establecida'}. Rendimiento por bloque registrado.`
        };
      }

      case 'OTIF': {
        // Always return otifDetails structure for the new view with SKU breakdown
        return {
          otifDetails: {
            orderId: item.orderId || item.id,
            cantidadSolicitada: item.quantity || item.pickedQuantity || 50,
            cantidadEntregada: item.pickedQuantity || item.quantity || 45,
            fechaPromesa: item.promisedDate || '2025-05-30',
            fechaEntrega: item.deliveryDate || '2025-05-28',
            onTime: item.onTime || (item.status === 'OTIF Cumplido' ? 'Sí' : 'No'),
            inFull: item.inFull || (item.status === 'OTIF Cumplido' ? 'Sí' : 'No'),
            cumplimiento: item.value || (item.status === 'OTIF Cumplido' ? 100 : 0)
          },
          skuDetails: item.skuDetails || [
            {
              sku: 'SKU-ELE001',
              solicitado: 10,
              entregado: item.status === 'OTIF Cumplido' ? 10 : 8,
              diferencia: item.status === 'OTIF Cumplido' ? 0 : -2,
              cumplimiento: item.status === 'OTIF Cumplido' ? '100.0' : '80.0',
              status: item.status === 'OTIF Cumplido' ? 'Completo' : 'Incompleto'
            },
            {
              sku: 'SKU-CLO042',
              solicitado: 15,
              entregado: 15,
              diferencia: 0,
              cumplimiento: '100.0',
              status: 'Completo'
            }
          ],
          notes: item.failureAnalysis || (item.status === 'OTIF Cumplido' 
            ? 'OTIF completado exitosamente según los parámetros establecidos.' 
            : 'Análisis OTIF: Falla detectada en cumplimiento de tiempo o cantidad.')
        };
      }

      default:
        return {
          steps: [
            { time: '10:00', action: 'Proceso iniciado', status: 'completed' },
            { time: '12:00', action: 'Datos procesados', status: 'completed' },
            { time: '14:00', action: 'Validación completada', status: 'completed' },
            { time: '16:00', action: 'Resultado registrado', status: 'completed' }
          ],
          notes: `Estado: ${item.status}. Proceso completado según especificaciones.`
        };
    }
  };

  const renderKpiSpecificTable = () => {
    switch (kpi.code) {
      case 'DOH':
        return (
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Días Disponibles</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiDetail?.detail.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                const detailInfo = getDetailedInfo(item, 'DOH');
                return (
                  <>
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-primary-600">{item.orderId}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{item.quantity} unidades</TableCell>
                      <TableCell>{item.value} días</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={item.status === 'Stock Normal' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {item.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(item.id)}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900">Detalle por SKU</h5>
                            {renderDetailedTable(detailInfo, 'DOH')}
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <p className="text-sm text-blue-800">{detailInfo.notes}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </TableComponent>
        );

      case 'DAMAGES':
        return (
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Unidades Recibidas</TableHead>
                <TableHead>% Daños</TableHead>
                <TableHead>Condición</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiDetail?.detail.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                const detailInfo = getDetailedInfo(item, 'DAMAGES');
                return (
                  <>
                    <TableRow 
                      key={item.id} 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      <TableCell className="font-medium text-primary-600">{item.orderId}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{item.quantity} u</TableCell>
                      <TableCell className="font-semibold">{item.value.toFixed(1)} %</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={item.value > 2 ? 'bg-red-100 text-red-800 font-semibold' : 'bg-green-100 text-green-800 font-semibold'}>
                            {item.value > 2 ? 'Crítico' : 'Bueno'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(item.id);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900">Detalle por SKU</h5>
                            {renderDetailedTable(detailInfo, 'DAMAGES')}
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <p className="text-sm text-blue-800">{detailInfo.notes}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </TableComponent>
        );

      case 'IRA':
        return (
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Qty Sistema</TableHead>
                <TableHead>Qty Física</TableHead>
                <TableHead>Precisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiDetail?.detail.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                const detailInfo = getDetailedInfo(item, 'IRA');
                return (
                  <>
                    <TableRow 
                      key={item.id} 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      <TableCell className="font-medium text-primary-600">{item.orderId}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{item.quantity} u</TableCell>
                      <TableCell>{item.value} u</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.value === item.quantity ? (
                            <div className="flex items-center gap-1">
                              <span className="text-green-600 text-lg">✓</span>
                              <Badge className="bg-green-100 text-green-800 font-semibold">100%</Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-red-600 text-lg">✗</span>
                              <Badge className="bg-red-100 text-red-800 font-semibold">
                                {item.quantity ? ((item.value / item.quantity) * 100).toFixed(1) : '0'}%
                              </Badge>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(item.id);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900">Detalle de Auditoría</h5>
                            {renderDetailedTable(detailInfo, 'IRA')}
                            {detailInfo.auditDetails && detailInfo.auditDetails.length > 0 && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <div className="text-sm font-medium text-blue-800 mb-1">Resumen de Auditor:</div>
                                <p className="text-sm text-blue-700">{detailInfo.notes}</p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </TableComponent>
        );

      case 'D2S':
        return (
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>Recepción</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Tiempo D2S</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiDetail?.detail.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                const detailInfo = getDetailedInfo(item, 'D2S');
                return (
                  <>
                    <TableRow 
                      key={item.id} 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      <TableCell className="font-medium text-primary-600">{item.orderId}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{item.quantity} u</TableCell>
                      <TableCell className="font-semibold">{item.value.toFixed(1)}h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            item.value <= 4 ? 'bg-green-100 text-green-800 font-semibold' :
                            item.value <= 4.4 ? 'bg-yellow-100 text-yellow-800 font-semibold' :
                            'bg-red-100 text-red-800 font-semibold'
                          }>
                            {item.value <= 4 ? 'Bueno' : item.value <= 4.4 ? 'Alerta' : 'Crítico'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(item.id);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900">Detalle Dock-to-Stock</h5>
                            {renderDetailedTable(detailInfo, 'D2S')}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <div className="text-sm font-medium text-blue-800 mb-1">Resumen del Proceso:</div>
                              <p className="text-sm text-blue-700">{detailInfo.notes}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </TableComponent>
        );

      case 'PRODUCTIVITY':
        return (
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Horas Trabajadas</TableHead>
                <TableHead>Unidades Procesadas</TableHead>
                <TableHead>Productividad (u/h)</TableHead>
                <TableHead>Bloque de Tiempo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiDetail?.detail.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                // Use cached detail info to ensure consistency
                const cacheKey = `${kpi.code}-${item.id}`;
                if (!detailCacheRef.current.has(cacheKey)) {
                  detailCacheRef.current.set(cacheKey, getDetailedInfo(item, kpi.code));
                }
                const detailInfo = detailCacheRef.current.get(cacheKey);
                const productivity = item.value;
                const horasEstimadas = detailInfo?.summary?.horasTrabajadas || 8;
                const unidadesEstimadas = detailInfo?.summary?.totalUnidades || Math.floor(productivity * horasEstimadas);
                
                // Status based on productivity vs target (160 u/h)
                const getProductivityStatus = (prod: number) => {
                  if (prod >= 160) return { text: 'Meta alcanzada', color: 'bg-green-100 text-green-800' };
                  if (prod >= 128) return { text: 'Bajo meta', color: 'bg-yellow-100 text-yellow-800' }; // 80% of 160
                  return { text: 'Crítico', color: 'bg-red-100 text-red-800' };
                };
                
                const statusInfo = getProductivityStatus(productivity);
                
                // Get the highest productivity time block for this employee
                const bestTimeBlock = detailInfo?.timeBlocks?.reduce((best: any, current: any) => 
                  (current.unidades > (best?.unidades || 0)) ? current : best
                , null);
                
                return (
                  <>
                    <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => toggleRowExpansion(item.id)}>
                      <TableCell className="font-medium text-primary-600">{item.orderId}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{horasEstimadas}.0 h</TableCell>
                      <TableCell className="text-right">{unidadesEstimadas} u</TableCell>
                      <TableCell className="text-right font-semibold">{productivity.toFixed(1)} u/h</TableCell>
                      <TableCell>
                        <div className="text-sm bg-blue-50 px-2 py-1 rounded">
                          <div className="font-medium text-blue-800">
                            {bestTimeBlock ? bestTimeBlock.bloque : '8:00 - 9:00'}
                          </div>
                          <div className="text-xs text-blue-600">
                            {bestTimeBlock ? `${bestTimeBlock.unidades} u` : `${Math.floor(productivity)} u`} (pico)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs font-semibold ${statusInfo.color}`}>
                            {statusInfo.text}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(item.id);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && detailInfo && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            {/* Tabs for detailed view */}
                            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                              <button 
                                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                                  getActiveTab(item.id) === 'sku'
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Clicking SKU tab for', item.id, 'detailInfo:', detailInfo);
                                  setActiveTabForItem(item.id, 'sku');
                                }}
                              >
                                Detalle SKU
                              </button>
                              <button 
                                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                                  getActiveTab(item.id) === 'time'
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Clicking Time tab for', item.id, 'detailInfo:', detailInfo);
                                  setActiveTabForItem(item.id, 'time');
                                }}
                              >
                                Bloques de tiempo
                              </button>
                            </div>

                            {/* SKU Detail Tab */}
                            {getActiveTab(item.id) === 'sku' && detailInfo?.skuDetails && (
                              <div className="space-y-3">
                                <h5 className="font-medium text-gray-900">Desglose por SKU</h5>
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">SKU</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Descripción</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Ubicación</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">Cant. Procesada</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">Bloque de Tiempo</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {detailInfo.skuDetails.map((sku: any, index: number) => {
                                        // Calculate realistic processing time based on overall productivity
                                        const productividadGeneral = productivity || 150; // u/h
                                        const tiempoProcesoHoras = sku.cantidadProcesada / productividadGeneral; // hours
                                        const tiempoProcesoMinutos = Math.ceil(tiempoProcesoHoras * 60); // minutes
                                        const horas = Math.floor(tiempoProcesoMinutos / 60);
                                        const minutos = tiempoProcesoMinutos % 60;
                                        const tiempoFormateado = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
                                        
                                        return (
                                          <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm font-mono text-gray-900">{sku.sku}</td>
                                            <td className="px-4 py-2 text-sm text-gray-700" title={sku.descripcion}>
                                              {sku.descripcion.length > 30 ? `${sku.descripcion.substring(0, 30)}...` : sku.descripcion}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600 bg-gray-50">{sku.ubicacion}</td>
                                            <td className="px-4 py-2 text-sm text-right font-medium">
                                              <span className={sku.status === 'Correcto' ? 'text-green-600' : sku.status === 'Faltante' ? 'text-red-600' : 'text-red-600'}>
                                                {sku.cantidadProcesada}
                                              </span>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                              <div className="bg-gray-100 px-2 py-1 rounded text-sm">
                                                <div className="font-medium text-gray-800">{tiempoFormateado}</div>
                                                <div className="text-xs text-gray-600">
                                                  {(sku.cantidadProcesada / (tiempoProcesoMinutos / 60)).toFixed(1)} u/h
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                                                sku.status === 'Correcto' ? 'bg-green-100 text-green-800' :
                                                sku.status === 'Faltante' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                              }`}>
                                                {sku.status === 'Correcto' ? '✓' : sku.status === 'Faltante' ? '◦' : '✕'} {sku.status}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                                
                                {/* CSV Export Button */}
                                <div className="flex justify-end">
                                  <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                    <Download className="h-3 w-3 mr-1" />
                                    CSV SKU
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Time Blocks Tab */}
                            {getActiveTab(item.id) === 'time' && detailInfo?.timeBlocks && (
                              <div className="space-y-3">
                                <h5 className="font-medium text-gray-900">Análisis por Bloques de Tiempo</h5>
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Bloque Hora</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">Unidades Procesadas</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {detailInfo.timeBlocks.map((block: any, index: number) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 text-sm text-gray-900">{block.bloque}</td>
                                          <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">{block.unidades} u</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Summary Card */}
                            {detailInfo?.summary && (
                              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <div className="text-sm font-semibold text-blue-900 mb-3">📊 Resumen del Turno de Productividad</div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-900">{detailInfo.summary.totalUnidades}</div>
                                    <div className="text-blue-700">Unidades Totales</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-900">{detailInfo.summary.horasTrabajadas}h</div>
                                    <div className="text-blue-700">Horas Trabajadas</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-900">{detailInfo.summary.productividadCalculada}</div>
                                    <div className="text-blue-700">Productividad (u/h)</div>
                                  </div>
                                  <div className="text-center">
                                    <div className={`text-lg font-bold ${detailInfo.summary.cumplimiento >= 100 ? 'text-green-600' : detailInfo.summary.cumplimiento >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                                      {detailInfo.summary.cumplimiento}%
                                    </div>
                                    <div className="text-blue-700">vs Meta {detailInfo.summary.meta} u/h</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </TableComponent>
        );

      case 'PICKING':
        return (
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Líneas Solicitadas</TableHead>
                <TableHead>Líneas Pickeadas</TableHead>
                <TableHead>Diferencia</TableHead>
                <TableHead>Exactitud</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiDetail?.detail.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                const detailInfo = getDetailedInfo(item, kpi.code);
                const isExact = item.value === item.quantity;
                const difference = item.value - (item.quantity || 0);
                const exactitud = (item.quantity || 0) > 0 ? ((item.value / (item.quantity || 1)) * 100) : 0;
                
                return (
                  <>
                    <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => toggleRowExpansion(item.id)}>
                      <TableCell className="font-medium text-primary-600">{item.orderId}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell className="font-semibold">{item.quantity}</TableCell>
                      <TableCell className="font-semibold">{item.value}</TableCell>
                      <TableCell className="text-center">
                        {difference !== 0 && (
                          <span className={`font-medium ${difference > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {difference > 0 ? `+${difference}` : difference}
                          </span>
                        )}
                        {difference === 0 && <span className="text-gray-500">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            exactitud === 100 ? 'bg-green-100 text-green-800 font-semibold' : 'bg-red-100 text-red-800 font-semibold'
                          }>
                            {exactitud === 100 ? (
                              <>
                                <span className="text-green-600 mr-1">✓</span>
                                Exacto
                              </>
                            ) : (
                              <>
                                <span className="text-red-600 mr-1">✖</span>
                                Error
                              </>
                            )}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(item.id);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900">Detalle por SKU</h5>
                            {renderDetailedTable(detailInfo, 'PICKING')}
                            
                            {/* Quick motivo registration - future phase */}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <div className="text-sm text-blue-800">
                                <strong>Análisis del Picking:</strong> {detailInfo.notes}
                              </div>
                            </div>
                            
                            {/* Recommended actions */}
                            <div className="mt-4 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                              <div className="text-sm text-orange-800">
                                <strong>Acciones Recomendadas:</strong>
                                <ul className="mt-1 ml-4 list-disc text-xs">
                                  <li>Revisión de capacitación al personal de preparación</li>
                                  <li>Uso obligatorio de escáner para confirmación de SKU y cantidad</li>
                                  <li>Auditorías de conteo a ciegas en rutas de alto error</li>
                                  <li>Incrementar validación en líneas con diferencia recurrente</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </TableComponent>
        );

      case 'LEADTIME':
        return (
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Objetivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiDetail?.detail.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                const detailInfo = getDetailedInfo(item, 'LEADTIME');
                return (
                  <>
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-primary-600">{item.orderId}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{item.quantity} unidades</TableCell>
                      <TableCell>{item.value.toFixed(1)} hrs</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={item.status === 'Dentro del objetivo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {item.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(item.id)}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900">Detalle del Proceso</h5>
                            <div className="space-y-2">
                              {detailInfo.steps.map((step: any, index: number) => (
                                <div key={index} className="flex items-center gap-3">
                                  <span className="text-sm text-gray-500 min-w-[50px]">{step.time}</span>
                                  <div className={`w-2 h-2 rounded-full ${
                                    step.status === 'completed' ? 'bg-green-500' : 
                                    step.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}></div>
                                  <span className="text-sm text-gray-700">{step.action}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <p className="text-sm text-blue-800">{detailInfo.notes}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </TableComponent>
        );

      case 'OTD':
        return (
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Promesa</TableHead>
                <TableHead>Fecha Entrega</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiDetail?.detail.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                const detailInfo = getDetailedInfo(item, 'OTD');
                return (
                  <>
                    <TableRow 
                      key={item.id} 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      <TableCell className="font-medium text-primary-600">{item.orderId}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{detailInfo.deliveryMetrics?.fechaPromesa || item.promisedDate || '2025-06-21'}</TableCell>
                      <TableCell className="font-semibold">
                        {detailInfo.deliveryMetrics?.fechaEntrega || item.deliveryDate || '2025-06-21'}
                        {(() => {
                          const promiseDate = new Date(item.promisedDate || '2025-06-21');
                          const deliveryDate = new Date(item.deliveryDate || '2025-06-21');
                          const actualDelay = Math.max(0, Math.floor((deliveryDate.getTime() - promiseDate.getTime()) / (1000 * 60 * 60 * 24)));
                          
                          return actualDelay > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              +{actualDelay}d retraso
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(() => {
                            // Calculate actual delay based on dates
                            const promiseDate = new Date(item.promisedDate || '2025-06-21');
                            const deliveryDate = new Date(item.deliveryDate || '2025-06-21');
                            const actualDelay = Math.max(0, Math.floor((deliveryDate.getTime() - promiseDate.getTime()) / (1000 * 60 * 60 * 24)));
                            const isOnTime = actualDelay === 0;
                            
                            return (
                              <Badge className={
                                isOnTime ? 'bg-green-100 text-green-800 font-semibold' :
                                'bg-red-100 text-red-800 font-semibold'
                              }>
                                {isOnTime ? 'A Tiempo' : 'Retraso (Crítico)'}
                              </Badge>
                            );
                          })()}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(item.id);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900">Timeline de Entrega</h5>
                            {renderDetailedTable(detailInfo, 'OTD')}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <div className="text-sm font-medium text-blue-800 mb-1">Análisis del Despacho:</div>
                              <p className="text-sm text-blue-700">{detailInfo.notes}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </TableComponent>
        );

      // OTIF specific table with enhanced features
      case 'OTIF':
        return (
          <div className="space-y-4">
            {/* Quick filter chips */}
            <div className="flex gap-2 mb-4">
              <Badge 
                variant="outline" 
                className={`cursor-pointer ${
                  otifFilter === 'todos' 
                    ? 'bg-blue-100 text-blue-800 border-blue-300' 
                    : 'hover:bg-blue-50 hover:text-blue-700'
                }`}
                onClick={() => setOtifFilter('todos')}
              >
                Todos
              </Badge>
              <Badge 
                variant="outline" 
                className={`cursor-pointer ${
                  otifFilter === 'tardio' 
                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                    : 'hover:bg-amber-50 hover:text-amber-700'
                }`}
                onClick={() => setOtifFilter('tardio')}
              >
                Tardío
              </Badge>
              <Badge 
                variant="outline" 
                className={`cursor-pointer ${
                  otifFilter === 'incompleto' 
                    ? 'bg-orange-100 text-orange-800 border-orange-300' 
                    : 'hover:bg-orange-50 hover:text-orange-700'
                }`}
                onClick={() => setOtifFilter('incompleto')}
              >
                Incompleto
              </Badge>
              <Badge 
                variant="outline" 
                className={`cursor-pointer ${
                  otifFilter === 'ambos' 
                    ? 'bg-red-100 text-red-800 border-red-300' 
                    : 'hover:bg-red-50 hover:text-red-700'
                }`}
                onClick={() => setOtifFilter('ambos')}
              >
                Ambos
              </Badge>
            </div>

            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Promesa</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Cumplimiento OTIF</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpiDetail?.detail.filter((item) => {
                  const isOnTime = (item as any).onTime === 'Sí' || item.status.includes('tiempo');
                  const isInFull = (item as any).inFull === 'Sí' || item.status.includes('completo');
                  const isOTIF = isOnTime && isInFull;
                  
                  switch (otifFilter) {
                    case 'todos':
                      return true;
                    case 'tardio':
                      return !isOnTime && isInFull;
                    case 'incompleto':
                      return isOnTime && !isInFull;
                    case 'ambos':
                      return !isOnTime && !isInFull;
                    default:
                      return true;
                  }
                }).map((item) => {
                  const isExpanded = expandedRows.has(item.id);
                  const detailInfo = getDetailedInfo(item, kpi.code);
                  
                  const isOnTime = (item as any).onTime === 'Sí' || item.status.includes('tiempo');
                  const isInFull = (item as any).inFull === 'Sí' || item.status.includes('completo');
                  const isOTIF = isOnTime && isInFull;
                  
                  let statusIcon, statusText, statusColor;
                  if (isOTIF) {
                    statusIcon = '✓';
                    statusText = 'Cumplida';
                    statusColor = 'bg-green-100 text-green-800';
                  } else if (!isOnTime && !isInFull) {
                    statusIcon = '✕';
                    statusText = 'Ambos';
                    statusColor = 'bg-red-100 text-red-800';
                  } else if (!isOnTime) {
                    statusIcon = '🕐';
                    statusText = 'OT tardío';
                    statusColor = 'bg-amber-100 text-amber-800';
                  } else {
                    statusIcon = '📦';
                    statusText = 'IF incompleta';
                    statusColor = 'bg-orange-100 text-orange-800';
                  }

                  return (
                    <>
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-primary-600">
                          <button className="text-blue-600 hover:underline">
                            {item.orderId}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.client}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.promisedDate}</TableCell>
                        <TableCell className={!isOnTime ? 'text-red-600 font-medium' : ''}>
                          {item.deliveryDate}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {isOTIF ? '100%' : '0%'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs font-semibold ${statusColor}`}>
                            <span className="mr-1" role="img" aria-label={statusText}>
                              {statusIcon}
                            </span>
                            {statusText}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(item.id)}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50 p-4">
                            <div className="space-y-4">
                              {/* OTIF Evaluation Panel */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg border">
                                  <div className="text-sm text-gray-600 mb-1">On Time</div>
                                  <div className={`text-lg font-semibold ${isOnTime ? 'text-green-600' : 'text-red-600'}`}>
                                    {(item as any).onTime || (isOnTime ? 'Sí' : 'No')} {!isOnTime && detailInfo?.deltaDays && `(${detailInfo.deltaDays})`}
                                  </div>
                                </div>
                                
                                <div className="bg-white p-3 rounded-lg border">
                                  <div className="text-sm text-gray-600 mb-1">In Full</div>
                                  <div className={`text-lg font-semibold ${isInFull ? 'text-green-600' : 'text-red-600'}`}>
                                    {(item as any).inFull || (isInFull ? 'Sí' : 'No')} {!isInFull && detailInfo?.faltantes && `(-${detailInfo.faltantes} u)`}
                                  </div>
                                </div>
                              </div>

                              {/* Funnel mini-chart */}
                              <div className="bg-white p-3 rounded-lg border">
                                <div className="text-sm text-gray-600 mb-2">Evaluación OTIF</div>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${isOnTime ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {isOnTime ? '✓' : '✕'}
                                  </div>
                                  <span className="text-gray-400">→</span>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${isInFull ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {isInFull ? '✓' : '✕'}
                                  </div>
                                  <span className="text-gray-400">→</span>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${isOTIF ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {isOTIF ? '✓' : '✕'}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-2">OT → IF → OTIF</div>
                              </div>

                              {/* SKU Details Table */}
                              {detailInfo?.skuDetails && (
                                <div className="bg-white p-3 rounded-lg border">
                                  <div className="text-sm text-gray-600 mb-2">Detalle por SKU</div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b">
                                          <th className="text-left py-2">SKU</th>
                                          <th className="text-right py-2">Solicitado</th>
                                          <th className="text-right py-2">Entregado</th>
                                          <th className="text-right py-2">Diferencia</th>
                                          <th className="text-left py-2">Estado línea</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {detailInfo.skuDetails.map((sku: any, idx: number) => (
                                          <tr key={idx} className="border-b">
                                            <td className="py-2 font-medium">{sku.sku}</td>
                                            <td className="py-2 text-right">{sku.solicitado}</td>
                                            <td className="py-2 text-right">{sku.entregado}</td>
                                            <td className={`py-2 text-right font-medium ${sku.diferencia > 0 ? 'text-green-600' : sku.diferencia < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                              {sku.diferencia > 0 ? '+' : ''}{sku.diferencia}
                                            </td>
                                            <td className="py-2">
                                              <Badge 
                                                variant="outline" 
                                                className={`text-xs ${
                                                  sku.status === 'Completo' ? 'bg-green-50 text-green-700' :
                                                  sku.status === 'Faltante' ? 'bg-red-50 text-red-700' :
                                                  'bg-amber-50 text-amber-700'
                                                }`}
                                              >
                                                {sku.status}
                                              </Badge>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Failure Message */}
                              {!isOTIF && detailInfo?.failureAnalysis && (
                                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                                  <div className="text-sm text-red-800 font-medium">
                                    OTIF fallido: {detailInfo.failureAnalysis}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </TableComponent>
          </div>
        );

      // Default table for READYOT and others  
      case 'READYOT':
      default:
        return (
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Promesa</TableHead>
                <TableHead>Fecha Entrega</TableHead>
                <TableHead>Cumplimiento</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiDetail?.detail.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                const detailInfo = getDetailedInfo(item, kpi.code);
                return (
                  <>
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-primary-600">{item.orderId}</TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{item.promisedDate}</TableCell>
                      <TableCell>{item.deliveryDate}</TableCell>
                      <TableCell>{item.value} %</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            kpi.code === 'READYOT' ? 
                              (item.value === 0 ? 'bg-gray-100 text-gray-600' :
                               item.value >= 90 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                              (item.status.includes('tiempo') || item.status.includes('Sí')
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800')
                          }>
                            {kpi.code === 'READYOT' ? 
                              (item.value === 0 ? 'Sin preparar' :
                               item.value >= 90 ? 'Listo a tiempo' : 'Retrasado') :
                              item.status
                            }
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(item.id)}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 p-4">
                          <div className="space-y-4">
                            {detailInfo && kpi.code === 'OTIF' && detailInfo.otifDetails ? (
                              <div className="space-y-4">
                                {/* OTIF Metrics Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm text-gray-600">On Time</div>
                                    <div className={`text-lg font-semibold ${detailInfo.otifDetails.onTime === 'Sí' ? 'text-green-600' : 'text-red-600'}`}>
                                      {detailInfo.otifDetails.onTime}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Prometido: {detailInfo.otifDetails.fechaPromesa}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Entregado: {detailInfo.otifDetails.fechaEntrega}
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm text-gray-600">In Full</div>
                                    <div className={`text-lg font-semibold ${detailInfo.otifDetails.inFull === 'Sí' ? 'text-green-600' : 'text-red-600'}`}>
                                      {detailInfo.otifDetails.inFull}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Solicitado: {detailInfo.otifDetails.cantidadSolicitada}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Entregado: {detailInfo.otifDetails.cantidadEntregada}
                                    </div>
                                  </div>
                                </div>

                                {/* Overall OTIF Result */}
                                <div className={`p-4 rounded-lg border-l-4 ${
                                  detailInfo.otifDetails.cumplimiento === 100 
                                    ? 'bg-green-50 border-green-400' 
                                    : 'bg-red-50 border-red-400'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className={`font-semibold ${
                                        detailInfo.otifDetails.cumplimiento === 100 ? 'text-green-800' : 'text-red-800'
                                      }`}>
                                        {detailInfo.otifDetails.cumplimiento === 100 ? 'OTIF Cumplido' : 'OTIF Fallido'}
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        Orden: {detailInfo.otifDetails.orderId}
                                      </div>
                                    </div>
                                    <div className={`text-2xl font-bold ${
                                      detailInfo.otifDetails.cumplimiento === 100 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {detailInfo.otifDetails.cumplimiento}%
                                    </div>
                                  </div>
                                </div>

                                {/* SKU Breakdown Table */}
                                {detailInfo.skuDetails && detailInfo.skuDetails.length > 0 && (
                                  <div className="space-y-3">
                                    <h5 className="font-medium text-gray-800">Desglose por SKU</h5>
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                                        <thead className="bg-gray-100">
                                          <tr>
                                            <th className="text-left py-3 px-4 font-medium border-b">SKU</th>
                                            <th className="text-right py-3 px-4 font-medium border-b">Solicitado</th>
                                            <th className="text-right py-3 px-4 font-medium border-b">Entregado</th>
                                            <th className="text-right py-3 px-4 font-medium border-b">Diferencia</th>
                                            <th className="text-right py-3 px-4 font-medium border-b">Cumplimiento</th>
                                            <th className="text-center py-3 px-4 font-medium border-b">Estado</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {detailInfo.skuDetails.map((sku: any, idx: number) => (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                              <td className="py-3 px-4 font-mono text-xs">{sku.sku}</td>
                                              <td className="py-3 px-4 text-right">{sku.solicitado}</td>
                                              <td className="py-3 px-4 text-right">{sku.entregado}</td>
                                              <td className={`py-3 px-4 text-right ${sku.diferencia !== 0 ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                                                {sku.diferencia === 0 ? '0' : (sku.diferencia > 0 ? `+${sku.diferencia}` : sku.diferencia)}
                                              </td>
                                              <td className={`py-3 px-4 text-right ${parseFloat(sku.cumplimiento) < 100 ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                                                {sku.cumplimiento}%
                                              </td>
                                              <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                  sku.status === 'Completo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                  {sku.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* Failure Analysis if applicable */}
                                {detailInfo.otifDetails.cumplimiento !== 100 && detailInfo.notes && (
                                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                                    <div className="text-sm font-medium text-blue-800 mb-1">Análisis de Falla:</div>
                                    <p className="text-sm text-blue-700">{detailInfo.notes}</p>
                                  </div>
                                )}
                              </div>
                            ) : detailInfo && detailInfo.steps ? (
                              <div className="space-y-4">
                                <h5 className="font-medium text-gray-900">Detalle del Proceso</h5>
                                <div className="space-y-2">
                                  {detailInfo.steps.map((step: any, index: number) => (
                                    <div key={index} className="flex items-center gap-3">
                                      <span className="text-sm text-gray-500 min-w-[50px]">{step.time}</span>
                                      <div className={`w-2 h-2 rounded-full ${
                                        step.status === 'completed' ? 'bg-green-500' : 
                                        step.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}></div>
                                      <span className="text-sm text-gray-700">{step.action}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                  <p className="text-sm text-blue-800">{detailInfo.notes}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                No hay información detallada disponible.
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </TableComponent>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-transparent rounded-lg flex items-center justify-center">
              {config?.icon && <config.icon className="h-5 w-5 text-primary-600" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-medium text-gray-900">
                {config?.label}
              </DialogTitle>
              <p className="text-sm text-gray-600">Análisis detallado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* KPI Description - Always Visible with Option to Collapse */}
        <div className="mb-4">
          <Collapsible open={showDescription} onOpenChange={setShowDescription}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 mb-2 cursor-pointer hover:text-blue-600">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium text-gray-700">¿Qué es este indicador?</span>
                {showDescription ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{config?.fullDescription}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Critical Alert for any KPI */}
        {criticalMessage && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {criticalMessage}
              {kpi.code === 'DAMAGES' && (
                <div className="mt-2 space-x-4">
                  <Button variant="link" className="p-0 h-auto text-red-700 font-medium">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Checklist de inspección
                  </Button>
                  <Button variant="link" className="p-0 h-auto text-red-700 font-medium">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Procedimientos de recepción
                  </Button>
                  <Button variant="link" className="p-0 h-auto text-red-700 font-medium">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Contacto de calidad
                  </Button>
                </div>
              )}
              {kpi.code === 'IRA' && (
                <div className="mt-2 flex gap-4">
                  <Button variant="link" className="p-0 h-auto text-red-700 font-medium">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Checklist de auditoría
                  </Button>
                </div>
              )}
              {kpi.code === 'D2S' && (
                <div className="mt-2 flex gap-4">
                  <Button variant="link" className="p-0 h-auto text-red-700 font-medium">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver procedimientos optimización
                  </Button>
                  <Button variant="link" className="p-0 h-auto text-red-700 font-medium">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Checklist de eficiencia
                  </Button>
                </div>
              )}


            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trend" className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Tendencia
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Distribución
            </TabsTrigger>
            <TabsTrigger value="detail" className="flex items-center">
              <Table className="mr-2 h-4 w-4" />
              Detalle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-4">
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Tendencia de {config?.label} - Últimos 30 días
              </h4>
              <p className="text-sm text-gray-600">Evolución del indicador con línea de objetivo y banda de rendimiento</p>
            </div>
            
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-gray-500">Cargando gráfico...</div>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={kpiDetail?.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={kpi.code === 'PICKING' ? [90, 100] : 
                               kpi.code === 'LEADTIME' ? [0, 80] :
                               kpi.code === 'READYOT' ? [70, 100] :
                               kpi.code === 'OTIF' ? [70, 100] :
                               ['dataMin - 5', 'dataMax + 5']}
                        label={{ value: kpi.unit === 'días' ? 'd' : kpi.unit === 'horas' ? 'h' : kpi.unit === 'unid/h' ? 'u/h' : kpi.unit === '%' ? '%' : kpi.unit, angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toFixed(1)} ${kpi.unit === 'días' ? 'd' : kpi.unit === 'horas' ? 'h' : kpi.unit === 'unid/h' ? 'u/h' : kpi.unit === '%' ? '%' : kpi.unit}`, 
                          name === 'value' ? 'Actual' : name === 'target' ? 'Objetivo' : name
                        ]}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Legend />
                      <defs>
                        <linearGradient id={`trendGradient-${kpi.code}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#9CA3AF" />
                          <stop offset="100%" stopColor={
                            kpi.code === 'OTIF' && kpi.value >= 95 ? '#059669' :
                            kpi.code === 'OTIF' && kpi.value >= 90 ? '#F59E0B' :
                            kpi.code === 'OTIF' ? '#DC2626' :
                            kpi.status === 'critical' ? '#DC2626' : 
                            kpi.status === 'warning' ? '#F59E0B' : '#059669'
                          } />
                        </linearGradient>
                        {/* OTIF Target Zone Gradient */}
                        {kpi.code === 'OTIF' && (
                          <linearGradient id={`otifTargetZone-${kpi.code}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(5, 150, 105, 0.1)" />
                            <stop offset="100%" stopColor="rgba(5, 150, 105, 0.05)" />
                          </linearGradient>
                        )}
                      </defs>
                      
                      {/* OTIF Enhanced Visualization */}
                      {kpi.code === 'OTIF' ? (
                        <>
                          {/* Target zone fill */}
                          <Area 
                            type="monotone" 
                            dataKey={() => 100}
                            fill="url(#otifTargetZone-OTIF)"
                            stroke="none"
                          />
                          {/* Main trend line with enhanced styling */}
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={`url(#trendGradient-${kpi.code})`}
                            strokeWidth={4}
                            name="OTIF Actual"
                            dot={{ r: 5, fill: kpi.value >= 95 ? '#059669' : kpi.value >= 90 ? '#F59E0B' : '#DC2626' }}
                          />
                          {/* Target reference line */}
                          <Line 
                            type="monotone" 
                            dataKey="target" 
                            stroke="#059669" 
                            strokeWidth={3}
                            strokeDasharray="8 4"
                            name="Objetivo 95%"
                            dot={{ r: 0 }}
                          />
                          {/* Critical threshold line */}
                          <Line 
                            type="monotone" 
                            dataKey={() => 90}
                            stroke="#F59E0B" 
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            name="Umbral Crítico 90%"
                            dot={{ r: 0 }}
                          />
                        </>
                      ) : (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={`url(#trendGradient-${kpi.code})`}
                            strokeWidth={3}
                            name="Valor Actual"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="target" 
                            stroke="#DC2626" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Objetivo"
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Enhanced Summary Cards - Special handling for DAMAGES and LEADTIME */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Actual</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {kpi.code === 'DAMAGES' ? `${kpi.value.toFixed(1)} %` : 
                       kpi.code === 'LEADTIME' && kpi.value < 0 ? 'ND' :
                       kpi.code === 'LEADTIME' ? `${kpi.value.toFixed(1)} h` :
                       kpi.code === 'READYOT' ? `${kpi.value.toFixed(1)} %` :
                       formatKpiValue(kpi.value, kpi.unit)}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Objetivo</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {kpi.code === 'DAMAGES' ? `${kpi.target.toFixed(1)} %` : 
                       kpi.code === 'LEADTIME' ? `≤${kpi.target} h` :
                       kpi.code === 'READYOT' ? `≥${kpi.target} %` :
                       formatKpiValue(kpi.target, kpi.unit)}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Promed. 30d</div>
                    <div className="text-3xl font-bold text-gray-700">
                      {kpiDetail?.trend ? (
                        kpi.code === 'DAMAGES' ? `${(kpiDetail.trend.reduce((sum, item) => sum + item.value, 0) / kpiDetail.trend.length).toFixed(1)} %` :
                        kpi.code === 'LEADTIME' ? `${(kpiDetail.trend.reduce((sum, item) => sum + item.value, 0) / kpiDetail.trend.length).toFixed(1)} h` : 
                        kpi.code === 'READYOT' ? `${(kpiDetail.trend.reduce((sum, item) => sum + item.value, 0) / kpiDetail.trend.length).toFixed(1)} %` :
                          formatKpiValue((kpiDetail.trend.reduce((acc, item) => acc + item.value, 0) / kpiDetail.trend.length), kpi.unit)
                      ) : (
                        kpi.code === 'DAMAGES' ? '0.0 %' : 
                        kpi.code === 'LEADTIME' ? '0.0 h' :
                        kpi.code === 'READYOT' ? '0.0 %' :
                        formatKpiValue(0, kpi.unit)
                      )}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Desviación</div>
                    <div className={`text-3xl font-bold ${
                      kpi.status === 'good' ? 'text-green-600' : 
                      kpi.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {kpi.code === 'DAMAGES' || kpi.code === 'OTD' || kpi.code === 'IRA' ? 
                        `${Math.abs(kpi.delta).toFixed(1)} pp` :
                        formatKpiValue(Math.abs(kpi.delta), kpi.unit)
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Distribución por Cliente</h4>
              <p className="text-sm text-gray-600">Análisis comparativo del {config?.label} por cliente</p>
            </div>
            
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-gray-500">Cargando distribución...</div>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <ResponsiveContainer width="100%" height={400}>
                    {kpi.code === 'OTIF' ? (
                      <BarChart data={kpiDetail?.distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis 
                          domain={[70, 100]}
                          label={{ value: '%', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          content={(props) => {
                            if (props.active && props.payload && props.label) {
                              const data = props.payload[0]?.payload;
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                  <p className="font-medium">{props.label}</p>
                                  <p className="text-sm text-blue-600">
                                    OTIF: {data?.value?.toFixed(1)}%
                                  </p>
                                  <p className="text-sm text-green-600">
                                    On Time: {data?.onTimeRate?.toFixed(1)}%
                                  </p>
                                  <p className="text-sm text-orange-600">
                                    In Full: {data?.inFullRate?.toFixed(1)}%
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Órdenes: {data?.orders || 0}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="onTimeRate" stackId="otif" fill="#059669" name="On Time %" />
                        <Bar dataKey="inFullRate" stackId="otif" fill="#F59E0B" name="In Full %" />
                        <Bar dataKey="value" fill="#1976D2" name="OTIF Combined %" />
                        <ReferenceLine y={95} stroke="#DC2626" strokeDasharray="5 5" label="Objetivo 95%" />
                        <ReferenceLine y={90} stroke="#F59E0B" strokeDasharray="3 3" label="Umbral 90%" />
                      </BarChart>
                    ) : (
                      <BarChart data={kpiDetail?.distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis 
                          label={{ value: kpi.unit, angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${Number(value).toFixed(1)} ${kpi.unit}`, 
                            name
                          ]}
                          labelFormatter={(label) => `Cliente: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="value" fill="#1976D2" name="Valor Actual" />
                        <Line 
                          type="monotone" 
                          dataKey="target" 
                          stroke="#F57C00" 
                          strokeDasharray="5 5"
                          name="Objetivo"
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Performance Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h5 className="font-medium text-gray-900">Performance por Cliente</h5>
                  </div>
                  <div className="overflow-x-auto">
                    <TableComponent>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Actual ({kpi.unit === 'días' ? 'd' : kpi.unit === 'horas' ? 'h' : kpi.unit === 'unid/h' ? 'u/h' : kpi.unit === '%' ? '%' : kpi.unit})</TableHead>
                          <TableHead>Objetivo ({kpi.unit === 'días' ? 'd' : kpi.unit === 'horas' ? 'h' : kpi.unit === 'unid/h' ? 'u/h' : kpi.unit === '%' ? '%' : kpi.unit})</TableHead>
                          <TableHead>Órdenes</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kpiDetail?.distribution.map((item, index) => {
                          const isHigherBetter = ['IRA', 'OTD', 'PICKING', 'READYOT', 'PRODUCTIVITY', 'OTIF'].includes(kpi.code);
                          const isLowerBetter = ['DOH', 'DAMAGES', 'D2S', 'LEADTIME'].includes(kpi.code);
                          
                          let status = 'good';
                          if (kpi.code === 'OTD') {
                            status = item.value >= 90 ? 'good' : item.value >= 85 ? 'warning' : 'critical';
                          } else if (isHigherBetter) {
                            status = item.value >= item.target ? 'good' : item.value >= item.target * 0.9 ? 'warning' : 'critical';
                          } else if (isLowerBetter) {
                            status = item.value <= item.target ? 'good' : item.value <= item.target * 1.2 ? 'warning' : 'critical';
                          }
                          
                          const statusBadge = getStatusBadgeProps(status as 'good' | 'warning' | 'critical');
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.category}</TableCell>
                              <TableCell className="font-semibold">{formatKpiValue(item.value, kpi.unit)}</TableCell>
                              <TableCell>{formatKpiValue(item.target, kpi.unit)}</TableCell>
                              <TableCell>{item.orders || 0}</TableCell>
                              <TableCell>
                                <Badge className={`text-xs font-semibold ${statusBadge.className}`}>
                                  <span className="mr-1">{statusBadge.icon}</span>
                                  {statusBadge.text}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </TableComponent>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="detail" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Datos Detallados</h4>
                <p className="text-sm text-gray-600">Registros individuales del {config?.label}</p>
              </div>
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-gray-500">Cargando datos...</div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar max-h-96">
                  {renderKpiSpecificTable()}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
