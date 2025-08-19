import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertParticipantSchema, insertAssetSchema, type BlockchainData } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register a new participant
  app.post('/api/register', async (req, res) => {
    try {
      const { user, role } = req.body;
      
      // Validate input
      const participantData = insertParticipantSchema.parse({
        username: user,
        role: role,
        status: 'active'
      });
      
      // Check if user already exists
      const existing = await storage.getParticipantByUsername(user);
      if (existing) {
        return res.status(409).json({ error: 'User already exists' });
      }
      
      // Create participant
      const participant = await storage.createParticipant(participantData);
      
      res.status(201).json({ 
        msg: `User ${user} registered as ${role}.`,
        participant 
      });
    } catch (error) {
      res.status(400).json({ error: 'Invalid input data' });
    }
  });

  // Add a supply chain event to the blockchain
  app.post('/api/add-event', async (req, res) => {
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

  // Get the complete blockchain
  app.get('/api/chain', async (req, res) => {
    try {
      const blockchain = await storage.getBlockchain();
      res.json(blockchain.map(block => ({
        index: block.index,
        timestamp: block.timestamp,
        data: block.data,
        prev_hash: block.prevHash,
        hash: block.hash
      })));
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve blockchain' });
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

  // Get all assets
  app.get('/api/assets', async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve assets' });
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

  // Get recent activities
  app.get('/api/recent-activities', async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      const participants = await storage.getAllParticipants();
      const assets = await storage.getAllAssets();
      
      // Get last 10 events with participant and asset details
      const recentEvents = events.slice(0, 10).map(event => {
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
      
      res.json(recentEvents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve recent activities' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
