import { type Express } from "express";
import { storage } from "./storage";
import { insertPropertySchema, insertPaymentSchema, insertOwnershipSchema } from "@shared/schema";
import { requireAuth, requireRole } from './auth';
import { body, validationResult } from 'express-validator';
import { traceSupplyChainEvent, traceAssetOperation } from './phoenix-otel';
import { auditLogger } from './security/audit-logger';

export function registerDetroitRoutes(app: Express): void {

  // ========================
  // DETROIT PROPERTY REGISTRY
  // ========================

  // Get all properties (public view)
  app.get('/api/detroit/properties', async (req, res) => {
    await traceSupplyChainEvent('Detroit.PropertyRegistry.List', {
      requestType: 'property_list',
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }, async () => {
      try {
        const properties = await storage.getAllProperties();
        res.json({
          message: 'Detroit property registry retrieved',
          properties: properties.map(prop => ({
            ...prop,
            assessedValueFormatted: `$${(prop.assessedValue! / 100).toLocaleString()}`,
            taxOwedFormatted: `$${(prop.taxOwed / 100).toLocaleString()}`
          })),
          total: properties.length
        });
      } catch (error) {
        console.error('Error fetching Detroit properties:', error);
        res.status(500).json({ 
          error: 'Failed to retrieve properties',
          code: 'DETROIT_PROPERTY_FETCH_ERROR'
        });
      }
    });
  });

  // Get specific property by ID
  app.get('/api/detroit/properties/:id', async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ 
          error: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      const owners = await storage.getOwners(property.id);
      const payments = await storage.getPaymentsByProperty(property.id);

      res.json({
        property: {
          ...property,
          assessedValueFormatted: `$${(property.assessedValue! / 100).toLocaleString()}`,
          taxOwedFormatted: `$${(property.taxOwed / 100).toLocaleString()}`
        },
        owners,
        payments: payments.map(payment => ({
          ...payment,
          amountFormatted: `$${(payment.amount / 100).toLocaleString()}`
        }))
      });
    } catch (error) {
      console.error('Error fetching property details:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve property details',
        code: 'PROPERTY_DETAIL_ERROR'
      });
    }
  });

  // Create new property (Detroit Government only)
  app.post('/api/detroit/properties', 
    requireAuth,
    requireRole(['government']),
    [
      body('propertyId').notEmpty().withMessage('Property ID is required'),
      body('address').notEmpty().withMessage('Address is required'),
      body('ownerId').notEmpty().withMessage('Owner ID is required'),
      body('assessedValue').isInt({ min: 0 }).withMessage('Assessed value must be a positive integer')
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      await traceAssetOperation('Detroit.Property.Create', req.body.propertyId, async () => {
        try {
          const property = await storage.createProperty(req.body);
          
          // Log property creation for audit
          await auditLogger.logAPIAccess(req, '/api/detroit/properties', 201, (req as any).user?.id);
          
          res.status(201).json({
            message: 'Property registered successfully',
            property: {
              ...property,
              assessedValueFormatted: `$${(property.assessedValue! / 100).toLocaleString()}`,
              taxOwedFormatted: `$${(property.taxOwed / 100).toLocaleString()}`
            }
          });
        } catch (error) {
          console.error('Error creating property:', error);
          res.status(500).json({ 
            error: 'Failed to create property',
            code: 'PROPERTY_CREATION_ERROR'
          });
        }
      });
    }
  );

  // ========================
  // DETROIT PAYMENT SYSTEM
  // ========================

  // Record payment (authenticated users)
  app.post('/api/detroit/payments',
    requireAuth,
    [
      body('propertyId').notEmpty().withMessage('Property ID is required'),
      body('paymentMethod').isIn(['usdc', 'eth', 'fiat']).withMessage('Invalid payment method'),
      body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer')
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      await traceSupplyChainEvent('Detroit.Payment.Record', {
        propertyId: req.body.propertyId,
        amount: req.body.amount,
        paymentMethod: req.body.paymentMethod,
        userId: (req as any).user?.id
      }, async () => {
        try {
          const payment = await storage.recordPayment({
            ...req.body,
            payerId: (req as any).user.id,
            status: 'completed' // Auto-complete for demo
          });

          // Update property tax owed amount
          const property = await storage.getProperty(req.body.propertyId);
          if (property) {
            const newTaxOwed = Math.max(0, property.taxOwed - req.body.amount);
            await storage.updateProperty(property.id, { taxOwed: newTaxOwed });
          }

          res.status(201).json({
            message: 'Payment recorded successfully',
            payment: {
              ...payment,
              amountFormatted: `$${(payment.amount / 100).toLocaleString()}`
            }
          });
        } catch (error) {
          console.error('Error recording payment:', error);
          res.status(500).json({ 
            error: 'Failed to record payment',
            code: 'PAYMENT_RECORD_ERROR'
          });
        }
      });
    }
  );

  // Get payments for a property
  app.get('/api/detroit/properties/:id/payments', async (req, res) => {
    try {
      const payments = await storage.getPaymentsByProperty(req.params.id);
      res.json({
        payments: payments.map(payment => ({
          ...payment,
          amountFormatted: `$${(payment.amount / 100).toLocaleString()}`
        })),
        total: payments.length
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve payments',
        code: 'PAYMENT_FETCH_ERROR'
      });
    }
  });

  // ========================
  // DETROIT OWNERSHIP SYSTEM
  // ========================

  // Record ownership transfer
  app.post('/api/detroit/ownership',
    requireAuth,
    [
      body('propertyId').notEmpty().withMessage('Property ID is required'),
      body('ownerId').notEmpty().withMessage('Owner ID is required'),
      body('fraction').isFloat({ min: 0, max: 1 }).withMessage('Fraction must be between 0 and 1')
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      await traceSupplyChainEvent('Detroit.Ownership.Transfer', {
        propertyId: req.body.propertyId,
        ownerId: req.body.ownerId,
        fraction: req.body.fraction,
        initiatedBy: (req as any).user?.id
      }, async () => {
        try {
          const ownership = await storage.addOwnership(req.body);
          
          res.status(201).json({
            message: 'Ownership recorded successfully',
            ownership
          });
        } catch (error) {
          console.error('Error recording ownership:', error);
          res.status(500).json({ 
            error: 'Failed to record ownership',
            code: 'OWNERSHIP_RECORD_ERROR'
          });
        }
      });
    }
  );

  // Get owners for a property
  app.get('/api/detroit/properties/:id/owners', async (req, res) => {
    try {
      const owners = await storage.getOwners(req.params.id);
      res.json({
        owners,
        total: owners.length
      });
    } catch (error) {
      console.error('Error fetching owners:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve owners',
        code: 'OWNER_FETCH_ERROR'
      });
    }
  });

  // ========================
  // DETROIT DASHBOARD
  // ========================

  // Detroit civic blockchain dashboard
  app.get('/api/detroit/dashboard', async (req, res) => {
    await traceSupplyChainEvent('Detroit.Dashboard.View', {
      requestType: 'civic_dashboard',
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }, async () => {
      try {
        const properties = await storage.getAllProperties();
        const payments = await storage.getAllEvents(); // Using events for demo
        const participants = await storage.getAllParticipants();

        const totalAssessedValue = properties.reduce((sum, prop) => sum + (prop.assessedValue || 0), 0);
        const totalTaxOwed = properties.reduce((sum, prop) => sum + prop.taxOwed, 0);
        const governmentProperties = properties.filter(p => {
          const participant = participants.find(part => part.id === p.ownerId);
          return participant?.role === 'government';
        });

        res.json({
          title: 'Detroit Civic Blockchain Dashboard',
          stats: {
            totalProperties: properties.length,
            totalAssessedValue: `$${(totalAssessedValue / 100).toLocaleString()}`,
            totalTaxOwed: `$${(totalTaxOwed / 100).toLocaleString()}`,
            governmentProperties: governmentProperties.length,
            activeResidents: participants.filter(p => p.role === 'resident').length,
            blockchainTransactions: payments.length
          },
          recentProperties: properties.slice(-5).map(prop => ({
            ...prop,
            assessedValueFormatted: `$${(prop.assessedValue! / 100).toLocaleString()}`,
            taxOwedFormatted: `$${(prop.taxOwed / 100).toLocaleString()}`
          })),
          municipalFeatures: [
            'Property tax blockchain payments',
            'Fractional ownership support',
            'Real-time property registry',
            'Crypto payment integration',
            'Municipal transparency',
            'Audit trail compliance'
          ]
        });
      } catch (error) {
        console.error('Error fetching Detroit dashboard:', error);
        res.status(500).json({ 
          error: 'Failed to load Detroit dashboard',
          code: 'DASHBOARD_ERROR'
        });
      }
    });
  });
}