import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { KpiData } from '@shared/schema';
import { KPI_CONFIG, formatKpiValue, formatDeltaWithTarget, formatDeltaPercentagePoints, getStatusBadgeProps, getKpiIconStyle } from '@/lib/kpi-utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
  kpi: KpiData;
  onClick: () => void;
}

export function KpiCard({ kpi, onClick }: KpiCardProps) {
  const config = KPI_CONFIG[kpi.code as keyof typeof KPI_CONFIG];
  const statusBadge = getStatusBadgeProps(kpi.status);
  const iconStyle = getKpiIconStyle(kpi.status);
  const IconComponent = config?.icon;

  const trendData = kpi.trend.map((value, index) => ({ value, index }));
  const isPositiveDelta = kpi.delta >= 0;
  const deltaColor = (() => {
    if (kpi.status === 'good') return 'text-green-600';
    if (kpi.status === 'warning') return 'text-yellow-600';
    return 'text-red-600';
  })();

  return (
    <Card 
      className="kpi-card-hover cursor-pointer border border-gray-200 hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              (kpi.code === 'PICKING' && kpi.value === 0) || (kpi.code === 'LEADTIME' && kpi.value < 0) ? 'bg-gray-200' : iconStyle
            }`} style={{ background: 'transparent' }}>
              {IconComponent && <IconComponent 
                className={`h-5 w-5 ${
                  kpi.code === 'PICKING' && kpi.value === 0 ? 'text-gray-500' : 
                  kpi.code === 'PICKING' ? 'text-red-600' :
                  kpi.code === 'LEADTIME' && kpi.value < 0 ? 'text-gray-500' : ''
                }`}
                style={kpi.code === 'PICKING' && kpi.value !== 0 ? {
                  fill: '#C82333',
                  stroke: 'white',
                  strokeWidth: '1px'
                } : undefined}
              />}
            </div>
            <h3 className="font-medium text-gray-900 text-sm" title={
              kpi.code === 'LEADTIME' ? 'Horas desde liberación hasta listo para embarque' :
              kpi.code === 'READYOT' ? '% de pedidos que alcanzan estado "ready" antes del corte operativo' :
              kpi.code === 'PRODUCTIVITY' ? 'Unidades enviadas por hora-persona' :
              kpi.code === 'OTIF' ? 'Porcentaje de órdenes que cumplen tanto tiempo de entrega como cantidad completa' :
              undefined
            }>
              {config?.label || kpi.label}
            </h3>
          </div>
          {(kpi.code === 'PICKING' && kpi.value === 0) || (kpi.code === 'LEADTIME' && kpi.value < 0) || (kpi.code === 'PRODUCTIVITY' && kpi.value === 0) ? (
            <Badge className="bg-gray-100 text-gray-600 font-semibold text-xs">
              <span className="mr-1">{kpi.code === 'LEADTIME' && kpi.value < 0 ? '⚠️' : '⏸'}</span>
              {kpi.code === 'LEADTIME' && kpi.value < 0 ? 'Datos inválidos' : kpi.code === 'PRODUCTIVITY' && kpi.value === 0 ? 'Sin registros' : 'ND'}
            </Badge>
          ) : (
            <Badge className={`text-xs font-semibold ${statusBadge.className}`}>
              <span className="mr-1">{statusBadge.icon}</span>
              {statusBadge.text}
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">
              {(kpi.code === 'PICKING' && kpi.value === 0) || (kpi.code === 'LEADTIME' && kpi.value < 0) || (kpi.code === 'PRODUCTIVITY' && kpi.value === 0) ? 
                '—' : 
                kpi.code === 'LEADTIME' ? 
                  `${kpi.value.toFixed(1)} h` : 
                  formatKpiValue(kpi.value, kpi.unit)
              }
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className={`font-semibold ${deltaColor}`}>
              {kpi.code === 'DAMAGES' || kpi.code === 'IRA' || kpi.code === 'PICKING' || kpi.code === 'READYOT' ? 
                formatDeltaPercentagePoints(kpi.delta, kpi.target, kpi.unit) :
                kpi.code === 'LEADTIME' && kpi.value >= 0 ?
                  `${kpi.delta >= 0 ? '↑' : '↓'} ${Math.abs(kpi.delta).toFixed(1)} h vs ${kpi.target} h` :
                formatDeltaWithTarget(kpi.delta, kpi.target, kpi.unit)
              }
            </span>
          </div>
          
          {/* Enhanced Sparkline with Gradient */}
          <div className="h-8 w-full">
            {((kpi.code === 'PICKING' && kpi.value === 0) || (kpi.code === 'LEADTIME' && kpi.value < 0)) ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">—</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient id={`gradient-${kpi.code}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={kpi.code === 'PICKING' || kpi.code === 'LEADTIME' ? '#9CA3AF' : '#9CA3AF'} />
                      <stop offset="100%" stopColor={
                        kpi.code === 'PICKING' ? '#C82333' :
                        kpi.code === 'LEADTIME' ? '#FFC107' :
                        kpi.code === 'OTIF' && kpi.value >= 95 ? '#059669' :
                        kpi.code === 'OTIF' && kpi.value >= 90 ? '#F59E0B' :
                        kpi.code === 'OTIF' ? '#DC2626' :
                        kpi.status === 'critical' ? '#DC2626' : 
                        kpi.status === 'warning' ? '#F59E0B' : '#059669'
                      } />
                    </linearGradient>
                    {kpi.code === 'OTIF' && (
                      <linearGradient id={`area-gradient-${kpi.code}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(5, 150, 105, 0.1)" />
                        <stop offset="100%" stopColor="rgba(5, 150, 105, 0)" />
                      </linearGradient>
                    )}
                  </defs>
                  {kpi.code === 'OTIF' && (
                    <defs>
                      <pattern id={`zone-${kpi.code}`} patternUnits="userSpaceOnUse" width="4" height="4">
                        <rect width="4" height="4" fill="rgba(5, 150, 105, 0.05)"/>
                      </pattern>
                    </defs>
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={`url(#gradient-${kpi.code})`}
                    strokeWidth={kpi.code === 'PICKING' || kpi.code === 'LEADTIME' ? 2 : 3}
                    dot={false}
                    fill={kpi.code === 'OTIF' ? `url(#area-gradient-${kpi.code})` : 'none'}
                  />

                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
