import { storage } from '../storage.js';
import type { KpiData, KpiDetailData, FilterParams } from '@shared/schema';

export class KpiService {
  static async getOverview(filters: FilterParams, userRole: string, userClientId?: string): Promise<KpiData[]> {
    return storage.getKpiOverview(filters, userRole, userClientId);
  }

  static async getDetail(code: string, filters: FilterParams, userRole: string, userClientId?: string): Promise<KpiDetailData> {
    return storage.getKpiDetail(code, filters, userRole, userClientId);
  }

  static async exportDetail(code: string, filters: FilterParams, userRole: string, userClientId?: string): Promise<any[]> {
    return storage.exportKpiDetail(code, filters, userRole, userClientId);
  }

  static formatForCsv(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }
}
