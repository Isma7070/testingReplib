import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { AuthService } from "./services/auth-service.js";
import { KpiService } from "./services/kpi-service.js";
import { AlertService } from "./services/alert-service.js";
import { storage } from "./storage.js";
import { authenticateToken, requireRole, type AuthenticatedRequest } from "./middleware/auth.js";
import { loginSchema, type FilterParams } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/v1/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.authenticate(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : "Authentication failed" });
    }
  });

  app.post("/api/v1/auth/register", async (req, res) => {
    try {
      const userData = z.object({
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(['admin', 'client']),
        clientId: z.string().optional(),
      }).parse(req.body);

      const result = await AuthService.register(userData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.get("/api/v1/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // Users management routes
  app.get("/api/v1/users", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.put("/api/v1/users/:id", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = z.object({
        username: z.string(),
        email: z.string().email(),
        role: z.enum(['admin', 'client']),
        clientId: z.string().optional(),
      }).parse(req.body);

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update user" });
    }
  });

  app.delete("/api/v1/users/:id", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves
      if (userId === req.user!.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // KPI routes
  app.get("/api/v1/kpis/overview", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const filters: FilterParams = {
        dateRange: (req.query.dateRange as string) || '30d',
        clientId: req.query.clientId as string,
        providerId: req.query.providerId as string,
        from: req.query.from as string,
        to: req.query.to as string,
      };

      const kpis = await KpiService.getOverview(filters, req.user!.role, req.user!.clientId);
      
      // Check for critical alerts
      await AlertService.checkKpiThresholds(kpis);
      
      res.json(kpis);
    } catch (error) {
      res.status(500).json({ message: "Failed to get KPI overview" });
    }
  });

  app.get("/api/v1/kpis/:code/detail", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.params;
      const filters: FilterParams = {
        dateRange: (req.query.dateRange as string) || '30d',
        clientId: req.query.clientId as string,
        providerId: req.query.providerId as string,
        from: req.query.from as string,
        to: req.query.to as string,
      };

      const detail = await KpiService.getDetail(code, filters, req.user!.role, req.user!.clientId);
      res.json(detail);
    } catch (error) {
      console.error('KPI detail error:', error);
      res.status(500).json({ message: "Failed to get KPI detail", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/v1/kpis/:code/export", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.params;
      const format = req.query.format as string || 'json';
      
      const filters: FilterParams = {
        dateRange: (req.query.dateRange as string) || '30d',
        clientId: req.query.clientId as string,
        providerId: req.query.providerId as string,
        from: req.query.from as string,
        to: req.query.to as string,
      };

      const data = await KpiService.exportDetail(code, filters, req.user!.role, req.user!.clientId);
      
      if (format === 'csv') {
        const csv = KpiService.formatForCsv(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${code}_detail.csv"`);
        res.send(csv);
      } else {
        res.json(data);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export KPI data" });
    }
  });

  // Master data routes
  app.get("/api/v1/clients", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  app.get("/api/v1/providers", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const providers = await storage.getProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get providers" });
    }
  });

  // Alerts routes
  app.get("/api/v1/alerts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const clientId = req.user!.role === 'client' ? req.user!.clientId : undefined;
      const alerts = await AlertService.getAlerts(clientId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get alerts" });
    }
  });

  app.put("/api/v1/alerts/config", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const thresholds = z.record(z.object({
        warning: z.number(),
        critical: z.number()
      })).parse(req.body);

      await storage.updateAlertThresholds(thresholds);
      res.json({ message: "Alert thresholds updated successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update alert configuration" });
    }
  });

  // Reports routes
  app.get("/api/v1/reports/export", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const querySchema = z.object({
        format: z.enum(['csv', 'excel']).default('csv'),
        dateRange: z.string().default('30d'),
        clientId: z.string().optional(),
        providerId: z.string().optional(),
        kpis: z.string().optional(),
        includeDetails: z.string().transform(s => s === 'true').default('true'),
        includeTrends: z.string().transform(s => s === 'true').default('false'),
      });

      const params = querySchema.parse(req.query);
      
      const filters: FilterParams = {
        dateRange: params.dateRange,
        clientId: params.clientId,
        providerId: params.providerId,
      };

      const selectedKpis = params.kpis ? params.kpis.split(',') : 
        ['DOH', 'DAMAGES', 'IRA', 'D2S', 'OTD', 'PICKING', 'LEADTIME', 'READYOT', 'PRODUCTIVITY', 'OTIF'];

      const reportData = await storage.generateReport(filters, selectedKpis, req.user!.role, req.user!.clientId, {
        includeDetails: params.includeDetails,
        includeTrends: params.includeTrends
      });

      if (params.format === 'csv') {
        const csvData = storage.formatReportAsCsv(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="3pl-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvData);
      } else {
        // For Excel format, we'll return CSV for now (can be enhanced later)
        const csvData = storage.formatReportAsCsv(reportData);
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename="3pl-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvData);
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
