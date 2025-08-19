import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertParticipantSchema, insertAssetSchema, type BlockchainData } from "@shared/schema";
import { requireAuth, requireRole, optionalAuth, generateToken, checkPassword, hashPassword } from './auth';
import { body, query, validationResult } from 'express-validator';
import crypto from 'crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  // Enhanced utility function for calculating block hash
  const calculateBlockHash = (block: any): string => {
    const { index, timestamp, data, prevHash } = block;
    const content = `${index}${timestamp}${JSON.stringify(data)}${prevHash}`;
    return crypto.createHash("sha256").update(content).digest("hex");
  };

  // Authentication endpoints with validation
  app.post('/api/auth/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 1 }).withMessage('Password is required'),
  ], async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { username, password } = req.body;

      // Find participant by username
      const participant = await storage.getParticipantByUsername(username);
      if (!participant || !(participant as any).passwordHash) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verify password
      const isValidPassword = checkPassword(password, (participant as any).passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate JWT token
      const token = generateToken({
        id: participant.id,
        username: participant.username,
        role: participant.role
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: participant.id,
          username: participant.username,
          role: participant.role
        }
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Login failed',
        code: 'LOGIN_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/auth/set-password', requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters',
          code: 'WEAK_PASSWORD'
        });
      }

      // Hash and store the new password
      const passwordHash = hashPassword(newPassword);
      await storage.updateParticipantPassword(req.user!.id, passwordHash);

      res.json({ message: 'Password updated successfully' });

    } catch (error) {
      res.status(500).json({ 
        error: 'Password update failed',
        code: 'PASSWORD_UPDATE_ERROR'
      });
    }
  });

  // Get current authenticated user info
  app.get('/api/auth/me', requireAuth, async (req, res) => {
    const participant = await storage.getParticipant(req.user!.id);
    if (!participant) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: participant.id,
      username: participant.username,
      role: participant.role,
      email: participant.email,
      status: participant.status
    });
  });

  // Register a new participant with enhanced validation
  app.post('/api/register', [
    body('user').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['manufacturer', 'shipper', 'retailer', 'other']).withMessage('Invalid role'),
    body('email').isEmail().withMessage('Valid email is required'),
  ], optionalAuth, async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { user, role, email, password } = req.body;
      
      // Check if user already exists
      const existing = await storage.getParticipantByUsername(user);
      if (existing) {
        return res.status(409).json({ 
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }
      
      // Validate input
      const participantData = insertParticipantSchema.parse({
        username: user,
        role: role,
        email: email,
        status: 'active'
      });
      
      // Create participant
      const participant = await storage.createParticipant(participantData);
      
      // Set password
      const passwordHash = hashPassword(password);
      await storage.updateParticipantPassword(participant.id, passwordHash);
      
      // Generate token for immediate login
      const token = generateToken({
        id: participant.id,
        username: participant.username,
        role: participant.role
      });
      
      res.status(201).json({ 
        message: `User ${user} registered successfully as ${role}`,
        user: {
          id: participant.id,
          username: participant.username,
          role: participant.role,
          email: participant.email,
          status: participant.status
        },
        token // Include token for immediate login
      });
    } catch (error) {
      res.status(400).json({ 
        error: 'Invalid input data',
        code: 'VALIDATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add a supply chain event to the blockchain (with optional auth)
  app.post('/api/add-event', optionalAuth, async (req, res) => {
    try {
      const { user, action, asset_id, meta = {} } = req.body;
      
      // Validate user exists
      const participant = await storage.getParticipantByUsername(user);
      if (!participant) {
        return res.status(403).json({ error: 'Unauthorized. Register first.' });
      }
      
      // Create or get asset
      let asset = await storage.getAsset(asset_id);
      if (!asset) {
        // Auto-create asset if it doesn't exist
        const assetData = insertAssetSchema.parse({
          assetId: asset_id,
          name: meta.name || `Asset ${asset_id}`,
          category: meta.category || 'General',
          currentStatus: action,
          currentLocation: meta.location || 'Unknown',
          batch: meta.batch
        });
        asset = await storage.createAsset(assetData);
      } else {
        // Update asset status and location
        await storage.updateAssetStatus(asset_id, action, meta.location);
      }
      
      // Prepare blockchain data
      const blockData: BlockchainData = {
        user,
        role: participant.role,
        action,
        asset_id,
        meta
      };
      
      // Add to blockchain
      const block = await storage.addBlock(blockData);
      
      // Create event record
      await storage.createEvent({
        blockId: block.id,
        participantId: participant.id,
        assetId: asset.id,
        action,
        location: meta.location,
        metadata: meta
      });
      
      res.json({ 
        msg: 'Event added.', 
        block: {
          index: block.index,
          timestamp: block.timestamp,
          data: block.data,
          hash: block.hash
        }
      });
    } catch (error) {
      res.status(400).json({ error: 'Invalid event data' });
    }
  });

  // Get the complete blockchain with pagination
  app.get('/api/chain', async (req, res) => {
    try {
      const { page = '1', limit = '10' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.max(1, Math.min(50, parseInt(limit as string))); // Cap at 50
      
      const blockchain = await storage.getBlockchain();
      
      // Apply pagination (reverse order for newest first)
      const reversedChain = [...blockchain].reverse();
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedBlocks = reversedChain.slice(startIndex, endIndex);
      
      res.json({
        blocks: paginatedBlocks.map(block => ({
          index: block.index,
          timestamp: block.timestamp,
          data: block.data,
          prev_hash: block.prevHash,
          hash: block.hash
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: blockchain.length,
          totalPages: Math.ceil(blockchain.length / limitNum),
          hasNext: endIndex < blockchain.length,
          hasPrev: pageNum > 1
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to retrieve blockchain',
        code: 'BLOCKCHAIN_FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Chain validation endpoint
  app.get('/api/chain/validate', async (req, res) => {
    try {
      const blockchain = await storage.getBlockchain();
      
      if (blockchain.length === 0) {
        return res.json({ 
          valid: false, 
          error: 'Empty blockchain',
          code: 'EMPTY_CHAIN'
        });
      }
      
      // Validate genesis block
      if (blockchain[0].index !== 0 || blockchain[0].prevHash !== "0") {
        return res.json({ 
          valid: false, 
          error: 'Invalid genesis block',
          code: 'INVALID_GENESIS',
          blockIndex: 0
        });
      }
      
      // Validate chain integrity
      for (let i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const previousBlock = blockchain[i - 1];
        
        // Check if current block's prevHash matches previous block's hash
        if (currentBlock.prevHash !== previousBlock.hash) {
          return res.json({ 
            valid: false, 
            error: 'Hash chain broken',
            code: 'BROKEN_CHAIN',
            blockIndex: i,
            expected: previousBlock.hash,
            actual: currentBlock.prevHash
          });
        }
        
        // Check if index is sequential
        if (currentBlock.index !== previousBlock.index + 1) {
          return res.json({ 
            valid: false, 
            error: 'Non-sequential block index',
            code: 'INVALID_INDEX',
            blockIndex: i
          });
        }

        // Verify block hash integrity by recalculating
        const expectedHash = calculateBlockHash({
          index: currentBlock.index,
          timestamp: currentBlock.timestamp,
          data: currentBlock.data,
          prevHash: currentBlock.prevHash
        });
        
        if (currentBlock.hash !== expectedHash) {
          return res.json({ 
            valid: false, 
            error: 'Block hash corrupted',
            code: 'CORRUPTED_HASH',
            blockIndex: i,
            expected: expectedHash,
            actual: currentBlock.hash
          });
        }
      }
      
      res.json({ 
        valid: true, 
        totalBlocks: blockchain.length,
        lastBlockHash: blockchain[blockchain.length - 1].hash,
        validatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Chain validation failed',
        code: 'VALIDATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all participants
  app.get('/api/participants', async (req, res) => {
    try {
      const participants = await storage.getAllParticipants();
      // Return in the format expected by the frontend
      const participantMap = participants.reduce((acc, p) => {
        acc[p.username] = p.role;
        return acc;
      }, {} as Record<string, string>);
      
      res.json(participantMap);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve participants' });
    }
  });

  // Get detailed participants list
  app.get('/api/participants-list', async (req, res) => {
    try {
      const participants = await storage.getAllParticipants();
      const events = await storage.getAllEvents();
      
      const participantsWithStats = participants.map(p => {
        const participantEvents = events.filter(e => e.participantId === p.id);
        return {
          ...p,
          eventCount: participantEvents.length
        };
      });
      
      res.json(participantsWithStats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve participants list' });
    }
  });

  // Get participant statistics
  app.get('/api/participant-stats', async (req, res) => {
    try {
      const stats = await storage.getParticipantStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve participant stats' });
    }
  });

  // Enhanced asset filtering with validation and sorting
  app.get('/api/assets', [
    query('status').optional().isString().withMessage('Status must be a string'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('batch').optional().isString().withMessage('Batch must be a string'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['name', 'createdAt', 'updatedAt', 'currentStatus']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  ], optionalAuth, async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { 
        status, 
        search, 
        category, 
        batch,
        page = '1', 
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)));
      
      // Get all assets
      let allAssets = await storage.getAllAssets();
      
      // Apply enhanced filters
      if (status) {
        allAssets = allAssets.filter(asset => 
          asset.currentStatus.toLowerCase().includes((status as string).toLowerCase())
        );
      }
      
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        allAssets = allAssets.filter(asset => 
          asset.name.toLowerCase().includes(searchTerm) ||
          asset.assetId.toLowerCase().includes(searchTerm) ||
          (asset.category && asset.category.toLowerCase().includes(searchTerm)) ||
          (asset.currentLocation && asset.currentLocation.toLowerCase().includes(searchTerm))
        );
      }
      
      if (category) {
        allAssets = allAssets.filter(asset => 
          asset.category && asset.category.toLowerCase().includes((category as string).toLowerCase())
        );
      }
      
      if (batch) {
        allAssets = allAssets.filter(asset => 
          asset.batch && asset.batch.toLowerCase().includes((batch as string).toLowerCase())
        );
      }
      
      // Apply sorting
      allAssets.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
            break;
          case 'updatedAt':
            aValue = new Date(a.updatedAt);
            bValue = new Date(b.updatedAt);
            break;
          case 'currentStatus':
            aValue = a.currentStatus.toLowerCase();
            bValue = b.currentStatus.toLowerCase();
            break;
          default:
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
        }
        
        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
      
      // Apply pagination
      const offset = (pageNum - 1) * limitNum;
      const total = allAssets.length;
      const paginatedAssets = allAssets.slice(offset, offset + limitNum);
      
      res.json({
        assets: paginatedAssets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: offset + limitNum < total,
          hasPrev: pageNum > 1
        },
        filters: {
          status,
          search,
          category,
          batch,
          sortBy,
          sortOrder
        }
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to retrieve assets',
        code: 'ASSETS_FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get asset by ID
  app.get('/api/assets/:assetId', async (req, res) => {
    try {
      const { assetId } = req.params;
      const asset = await storage.getAsset(assetId);
      
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      
      // Get asset events
      const events = await storage.getEventsByAsset(asset.id);
      
      res.json({ asset, events });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve asset' });
    }
  });

  // Get dashboard statistics
  app.get('/api/dashboard-stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
    }
  });

  // Get recent activities with pagination
  app.get('/api/recent-activities', async (req, res) => {
    try {
      const { limit = '10', participantId, assetId, action } = req.query;
      const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)));
      
      let events = await storage.getAllEvents();
      const participants = await storage.getAllParticipants();
      const assets = await storage.getAllAssets();
      
      // Apply filters
      if (participantId) {
        events = events.filter(event => event.participantId === participantId);
      }
      if (assetId) {
        events = events.filter(event => event.assetId === assetId);
      }
      if (action) {
        events = events.filter(event => event.action === action);
      }
      
      // Get recent events with participant and asset details
      const recentEvents = events.slice(0, limitNum).map(event => {
        const participant = participants.find(p => p.id === event.participantId);
        const asset = assets.find(a => a.id === event.assetId);
        
        return {
          id: event.id,
          action: event.action,
          participantName: participant?.username || 'Unknown',
          assetId: asset?.assetId || 'Unknown',
          location: event.location,
          timestamp: event.timestamp,
          metadata: event.metadata
        };
      });
      
      res.json({
        activities: recentEvents,
        total: events.length,
        limit: limitNum
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to retrieve recent activities',
        code: 'ACTIVITIES_FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Chatbot endpoint
  app.post('/api/chatbot', async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const userInput = message.trim().toLowerCase();
      
      // Check for asset tracking queries
      if (userInput.includes('where') && userInput.includes('asset')) {
        const assetIdMatch = message.match(/[a-zA-Z]+-\d+-\d+|\d+/);
        const assetId = assetIdMatch ? assetIdMatch[0] : null;
        
        if (assetId) {
          const asset = await storage.getAsset(assetId);
          if (asset) {
            const events = await storage.getEventsByAsset(asset.id);
            const recentEvent = events[events.length - 1];
            
            let reply = `Asset ${assetId} is currently '${asset.currentStatus}'`;
            if (asset.currentLocation) {
              reply += ` at ${asset.currentLocation}`;
            }
            
            if (recentEvent) {
              const participant = await storage.getParticipant(recentEvent.participantId || '');
              reply += `. Latest event: ${recentEvent.action} by ${participant?.username || 'Unknown'} on ${recentEvent.timestamp.toLocaleDateString()}.`;
            }
            
            return res.json({ reply });
          } else {
            return res.json({ 
              reply: `Asset ${assetId} not found in the system. Please check the asset ID or register it first.` 
            });
          }
        } else {
          return res.json({ 
            reply: "I couldn't find an asset ID in your message. Please specify an asset ID like 'PRD-2024-001'." 
          });
        }
      }
      
      // Help queries
      if (userInput.includes('help') || userInput.includes('how')) {
        return res.json({
          reply: `I can help you with OriginLedger! Try asking:
• 'Where is asset PRD-2024-001?' - Track asset location and status
• 'How do I register?' - Learn about participant registration
• 'How do I add an event?' - Learn about recording supply chain events
• 'What participants are registered?' - See current participants`
        });
      }
      
      // Registration instructions
      if (userInput.includes('register') || userInput.includes('participant')) {
        const participants = await storage.getAllParticipants();
        return res.json({
          reply: `To register as a participant, use the 'Add Participant' button in the Participants section. You can register as: manufacturer, shipper, retailer, or other. Currently ${participants.length} participants are registered.`
        });
      }
      
      // Event adding instructions
      if (userInput.includes('add') && (userInput.includes('event') || userInput.includes('shipment'))) {
        return res.json({
          reply: "To add a supply chain event, go to the 'Add Event' section. You'll need: participant name, action type (manufactured, shipped, received, etc.), asset ID, and optional location/metadata. Events are automatically added to the blockchain."
        });
      }
      
      // Participants query
      if (userInput.includes('participants') && userInput.includes('who')) {
        const participants = await storage.getAllParticipants();
        if (participants.length > 0) {
          const participantList = participants.slice(0, 5).map(p => `${p.username} (${p.role})`);
          return res.json({
            reply: `Registered participants: ${participantList.join(', ')}${participants.length > 5 ? '...' : ''}. Total: ${participants.length} participants.`
          });
        } else {
          return res.json({
            reply: "No participants are currently registered. Use the 'Add Participant' button to register the first participant."
          });
        }
      }
      
      // Blockchain info
      if (userInput.includes('blockchain') || userInput.includes('blocks')) {
        const blockchain = await storage.getBlockchain();
        const events = await storage.getAllEvents();
        return res.json({
          reply: `OriginLedger blockchain has ${blockchain.length} blocks. Total events recorded: ${events.length}.`
        });
      }
      
      // Greeting
      if (['hello', 'hi', 'hey'].some(greeting => userInput.includes(greeting))) {
        return res.json({
          reply: "Hello! I'm the OriginLedger assistant. I can help you track assets, understand how to use the platform, and answer questions about your supply chain. What would you like to know?"
        });
      }
      
      // Default fallback
      return res.json({
        reply: "I didn't understand that question. Try asking about asset tracking ('Where is asset 12345?'), platform help ('How do I register?'), or say 'help' for more options."
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Chatbot error occurred',
        code: 'CHATBOT_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Audit log endpoint
  app.get('/api/audit-log', async (req, res) => {
    try {
      const { startDate, endDate, participantId, assetId, format = 'json' } = req.query;
      
      let events = await storage.getAllEvents();
      const participants = await storage.getAllParticipants();
      const assets = await storage.getAllAssets();
      const blockchain = await storage.getBlockchain();
      
      // Apply date filters
      if (startDate) {
        const start = new Date(startDate as string);
        events = events.filter(event => event.timestamp >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        events = events.filter(event => event.timestamp <= end);
      }
      if (participantId) {
        events = events.filter(event => event.participantId === participantId);
      }
      if (assetId) {
        events = events.filter(event => event.assetId === assetId);
      }
      
      // Create audit entries
      const auditEntries = events.map(event => {
        const participant = participants.find(p => p.id === event.participantId);
        const asset = assets.find(a => a.id === event.assetId);
        const block = blockchain.find(b => b.id === event.blockId);
        
        return {
          eventId: event.id,
          blockIndex: block?.index || 'N/A',
          blockHash: block?.hash || 'N/A',
          timestamp: event.timestamp,
          participant: participant?.username || 'Unknown',
          participantRole: participant?.role || 'Unknown',
          action: event.action,
          assetId: asset?.assetId || 'Unknown',
          assetName: asset?.name || 'Unknown',
          location: event.location || 'N/A',
          metadata: event.metadata
        };
      });
      
      // Return CSV format if requested
      if (format === 'csv') {
        const csvHeaders = 'Event ID,Block Index,Block Hash,Timestamp,Participant,Role,Action,Asset ID,Asset Name,Location\n';
        const csvRows = auditEntries.map(entry => 
          `${entry.eventId},${entry.blockIndex},${entry.blockHash},${entry.timestamp.toISOString()},${entry.participant},${entry.participantRole},${entry.action},${entry.assetId},${entry.assetName},${entry.location || ''}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=originledger-audit-${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csvHeaders + csvRows);
      }
      
      res.json({
        auditEntries,
        summary: {
          totalEvents: auditEntries.length,
          dateRange: {
            start: startDate || 'N/A',
            end: endDate || 'N/A'
          },
          generatedAt: new Date().toISOString(),
          chainValidation: {
            totalBlocks: blockchain.length,
            lastBlockHash: blockchain[blockchain.length - 1]?.hash || 'N/A'
          }
        }
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to generate audit log',
        code: 'AUDIT_LOG_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check with comprehensive system status
  app.get('/api/health', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      const blockchain = await storage.getBlockchain();
      const participants = await storage.getAllParticipants();
      
      // Simple chain validation
      let chainValid = true;
      if (blockchain.length > 1) {
        for (let i = 1; i < blockchain.length; i++) {
          if (blockchain[i].prevHash !== blockchain[i - 1].hash) {
            chainValid = false;
            break;
          }
        }
      }
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'in-memory',
        blockchain: {
          totalBlocks: blockchain.length,
          valid: chainValid,
          lastBlockHash: blockchain[blockchain.length - 1]?.hash || 'none'
        },
        statistics: stats,
        participants: participants.length,
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Import and mount subscription routes
  const subscriptionRoutes = await import('./subscription-routes');
  app.use("/api/subscription", subscriptionRoutes.default);

  const httpServer = createServer(app);
  return httpServer;
}
