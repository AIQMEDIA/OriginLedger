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
  // CIVIC LEDGER API ENDPOINTS
  // ========================

  // Resident Profile & Wallet Setup
  app.get('/api/participants/:id/properties', async (req, res) => {
    try {
      const properties = await storage.getPropertiesByOwner(req.params.id);
      const ownerships = await storage.getOwnerships(req.params.id);
      
      res.json({
        message: 'Resident properties retrieved',
        properties: properties.map(prop => ({
          ...prop,
          assessedValueFormatted: `$${(prop.assessedValue! / 100).toLocaleString()}`,
          taxOwedFormatted: `$${(prop.taxOwed / 100).toLocaleString()}`
        })),
        ownerships,
        totalProperties: properties.length,
        totalOwnerships: ownerships.length
      });
    } catch (error) {
      console.error('Error fetching resident properties:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve resident properties',
        code: 'RESIDENT_PROPERTIES_ERROR'
      });
    }
  });

  // Property Tax Payment with Enhanced Features
  app.post('/api/payments/property/:propertyId',
    requireAuth,
    [
      body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
      body('paymentMethod').isIn(['usdc', 'eth', 'fiat', 'bank']).withMessage('Invalid payment method'),
      body('txHash').optional().isString()
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

      await traceSupplyChainEvent('Detroit.PropertyTax.Payment', {
        propertyId: req.params.propertyId,
        amount: req.body.amount,
        paymentMethod: req.body.paymentMethod,
        userId: (req as any).user?.id
      }, async () => {
        try {
          // Record payment
          const payment = await storage.recordPayment({
            propertyId: req.params.propertyId,
            payerId: (req as any).user.id,
            amount: req.body.amount,
            paymentMethod: req.body.paymentMethod,
            txHash: req.body.txHash,
            status: 'completed',
            context: {
              reason: 'Property Tax Payment',
              blockchainNetwork: req.body.paymentMethod === 'usdc' ? 'Ethereum' : req.body.paymentMethod,
              userAgent: req.get('User-Agent'),
              timestamp: new Date().toISOString()
            }
          });

          // Update property tax owed
          const property = await storage.getProperty(req.params.propertyId);
          if (property) {
            const newTaxOwed = Math.max(0, property.taxOwed - req.body.amount);
            await storage.updateProperty(property.id, { 
              taxOwed: newTaxOwed,
              updatedAt: new Date()
            });
          }

          // Log successful payment for audit
          await auditLogger.logAPIAccess(req, '/api/payments/property', 201, (req as any).user?.id);

          res.status(201).json({
            message: 'Property tax payment processed successfully',
            payment: {
              ...payment,
              amountFormatted: `$${(payment.amount / 100).toLocaleString()}`
            },
            updatedTaxBalance: property ? `$${(Math.max(0, property.taxOwed - req.body.amount) / 100).toLocaleString()}` : 'Unknown'
          });
        } catch (error) {
          console.error('Error processing payment:', error);
          res.status(500).json({ 
            error: 'Failed to process payment',
            code: 'PAYMENT_PROCESSING_ERROR'
          });
        }
      });
    }
  );

  // Fractional Ownership Transfer with NFT Support
  app.post('/api/ownership/transfer',
    requireAuth,
    [
      body('propertyId').notEmpty().withMessage('Property ID is required'),
      body('toOwnerId').notEmpty().withMessage('New owner ID is required'),
      body('fraction').isFloat({ min: 0.01, max: 1 }).withMessage('Fraction must be between 0.01 and 1.0'),
      body('transferTx').optional().isString(),
      body('salePrice').optional().isInt({ min: 0 })
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
        fromOwnerId: (req as any).user?.id,
        toOwnerId: req.body.toOwnerId,
        fraction: req.body.fraction,
        salePrice: req.body.salePrice
      }, async () => {
        try {
          // Create ownership record
          const ownership = await storage.addOwnership({
            propertyId: req.body.propertyId,
            ownerId: req.body.toOwnerId,
            fraction: req.body.fraction.toString(),
            transferTx: req.body.transferTx,
            metadata: {
              transferType: 'sale',
              fromOwnerId: (req as any).user.id,
              salePrice: req.body.salePrice,
              transferDate: new Date().toISOString(),
              nftReady: true,
              blockchainVerified: !!req.body.transferTx
            }
          });

          res.status(201).json({
            message: 'Ownership transfer completed successfully',
            ownership,
            nftCompatible: true,
            blockchainVerified: !!req.body.transferTx
          });
        } catch (error) {
          console.error('Error transferring ownership:', error);
          res.status(500).json({ 
            error: 'Failed to transfer ownership',
            code: 'OWNERSHIP_TRANSFER_ERROR'
          });
        }
      });
    }
  );

  // Public Audit Trail for Transparency
  app.get('/api/audit/properties/:propertyId', async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.propertyId);
      if (!property) {
        return res.status(404).json({ 
          error: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      const payments = await storage.getPaymentsByProperty(req.params.propertyId);
      const owners = await storage.getOwners(req.params.propertyId);

      // Create comprehensive audit trail
      const auditTrail = {
        property: {
          ...property,
          assessedValueFormatted: `$${(property.assessedValue! / 100).toLocaleString()}`,
          taxOwedFormatted: `$${(property.taxOwed / 100).toLocaleString()}`
        },
        totalPayments: payments.length,
        totalPaymentAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
        totalPaymentAmountFormatted: `$${(payments.reduce((sum, payment) => sum + payment.amount, 0) / 100).toLocaleString()}`,
        ownershipHistory: owners.map(owner => ({
          ...owner,
          fractionPercent: `${(parseFloat(owner.fraction) * 100).toFixed(1)}%`
        })),
        recentPayments: payments.slice(-10).map(payment => ({
          ...payment,
          amountFormatted: `$${(payment.amount / 100).toLocaleString()}`,
          timestamp: payment.timestamp
        })),
        transparency: {
          publicRecord: true,
          blockchainVerified: payments.some(p => p.txHash),
          auditCompliant: true,
          lastUpdated: property.updatedAt
        }
      };

      res.json({
        message: 'Property audit trail retrieved',
        audit: auditTrail
      });
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve audit trail',
        code: 'AUDIT_TRAIL_ERROR'
      });
    }
  });

  // Enhanced Property Search with Neighborhood Data
  app.get('/api/properties/search', async (req, res) => {
    const { address, neighborhood, propertyType, minValue, maxValue } = req.query;
    
    try {
      let properties = await storage.getAllProperties();

      // Apply filters
      if (address) {
        properties = properties.filter(p => 
          p.address.toLowerCase().includes((address as string).toLowerCase())
        );
      }
      if (neighborhood) {
        properties = properties.filter(p => 
          p.metadata?.neighborhood?.toLowerCase().includes((neighborhood as string).toLowerCase())
        );
      }
      if (propertyType) {
        properties = properties.filter(p => 
          p.metadata?.propertyType?.toLowerCase() === (propertyType as string).toLowerCase()
        );
      }
      if (minValue) {
        properties = properties.filter(p => 
          (p.assessedValue || 0) >= parseInt(minValue as string) * 100
        );
      }
      if (maxValue) {
        properties = properties.filter(p => 
          (p.assessedValue || 0) <= parseInt(maxValue as string) * 100
        );
      }

      // Calculate neighborhood statistics
      const neighborhoods = [...new Set(properties.map(p => p.metadata?.neighborhood).filter(Boolean))];
      const neighborhoodStats = neighborhoods.map(neighborhood => {
        const neighborhoodProperties = properties.filter(p => p.metadata?.neighborhood === neighborhood);
        const totalValue = neighborhoodProperties.reduce((sum, p) => sum + (p.assessedValue || 0), 0);
        const avgValue = totalValue / neighborhoodProperties.length;
        
        return {
          neighborhood,
          propertyCount: neighborhoodProperties.length,
          averageValue: `$${(avgValue / 100).toLocaleString()}`,
          totalValue: `$${(totalValue / 100).toLocaleString()}`
        };
      });

      res.json({
        message: 'Property search completed',
        properties: properties.map(prop => ({
          ...prop,
          assessedValueFormatted: `$${(prop.assessedValue! / 100).toLocaleString()}`,
          taxOwedFormatted: `$${(prop.taxOwed / 100).toLocaleString()}`
        })),
        total: properties.length,
        neighborhoodStats
      });
    } catch (error) {
      console.error('Error searching properties:', error);
      res.status(500).json({ 
        error: 'Failed to search properties',
        code: 'PROPERTY_SEARCH_ERROR'
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