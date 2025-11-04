import { storage } from '../storage.js';
import type { Alert, KpiData } from '@shared/schema';
import nodemailer from 'nodemailer';

export class AlertService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async checkKpiThresholds(kpis: KpiData[]): Promise<void> {
    for (const kpi of kpis) {
      if (kpi.status === 'critical') {
        await this.createAlert(kpi);
      }
    }
  }

  private static async createAlert(kpi: KpiData): Promise<void> {
    // Check if similar alert already exists in last hour
    const existingAlerts = await storage.getAlerts();
    const recentAlert = existingAlerts.find(alert => 
      alert.kpiCode === kpi.code && 
      new Date(alert.createdAt!).getTime() > Date.now() - 60 * 60 * 1000 // 1 hour
    );

    if (recentAlert) {
      return; // Don't create duplicate alerts
    }

    const alert = await storage.createAlert({
      kpiCode: kpi.code,
      clientId: 'ALL', // You might want to make this client-specific
      message: `${kpi.label} está por debajo del umbral crítico: ${kpi.value}${kpi.unit} (Target: ${kpi.target}${kpi.unit})`,
      severity: 'high',
      value: kpi.value.toString(),
      threshold: kpi.target.toString(),
      resolved: false,
    });

    // Send email notification
    await this.sendEmailAlert(alert, kpi);
  }

  private static async sendEmailAlert(alert: Alert, kpi: KpiData): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.ALERT_EMAIL_TO) {
      console.log('Email configuration missing, skipping alert email');
      return;
    }

    const emailHtml = `
      <h2>🚨 Alerta Crítica - Dashboard 3PL</h2>
      <p><strong>KPI:</strong> ${kpi.label}</p>
      <p><strong>Valor Actual:</strong> ${kpi.value}${kpi.unit}</p>
      <p><strong>Objetivo:</strong> ${kpi.target}${kpi.unit}</p>
      <p><strong>Desviación:</strong> ${kpi.delta}${kpi.unit}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      <hr>
      <p>Por favor, revise el dashboard para más detalles.</p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL_TO,
        subject: `🚨 Alerta Crítica: ${kpi.label}`,
        html: emailHtml,
      });
    } catch (error) {
      console.error('Failed to send alert email:', error);
    }
  }

  static async getAlerts(clientId?: string): Promise<Alert[]> {
    return storage.getAlerts(clientId);
  }
}
