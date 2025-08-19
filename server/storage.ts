import { 
  type Block, type InsertBlock, 
  type Participant, type InsertParticipant,
  type Asset, type InsertAsset,
  type Event, type InsertEvent,
  type BlockchainData, type ParticipantStats, type DashboardStats
} from "@shared/schema";
import { randomUUID } from "crypto";
import crypto from "crypto";

export interface IStorage {
  // Participant operations
  getParticipant(id: string): Promise<Participant | undefined>;
  getParticipantByUsername(username: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  getAllParticipants(): Promise<Participant[]>;
  getParticipantStats(): Promise<ParticipantStats>;
  
  // Blockchain operations
  addBlock(data: BlockchainData): Promise<Block>;
  getBlockchain(): Promise<Block[]>;
  getGenesisBlock(): Promise<Block>;
  getBlock(id: string): Promise<Block | undefined>;
  
  // Asset operations
  createAsset(asset: InsertAsset): Promise<Asset>;
  getAsset(assetId: string): Promise<Asset | undefined>;
  getAllAssets(): Promise<Asset[]>;
  updateAssetStatus(assetId: string, status: string, location?: string): Promise<Asset | undefined>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEventsByAsset(assetId: string): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;
  
  // Statistics
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private blocks: Map<string, Block>;
  private participants: Map<string, Participant>;
  private assets: Map<string, Asset>;
  private events: Map<string, Event>;
  private blockIndex: number;

  constructor() {
    this.blocks = new Map();
    this.participants = new Map();
    this.assets = new Map();
    this.events = new Map();
    this.blockIndex = 0;
    this.initializeGenesis();
  }

  private initializeGenesis() {
    const genesisBlock: Block = {
      id: randomUUID(),
      index: 0,
      timestamp: new Date(),
      data: { action: "genesis" } as any,
      prevHash: "0",
      hash: this.calculateHash(0, new Date(), { action: "genesis" }, "0")
    };
    this.blocks.set(genesisBlock.id, genesisBlock);
  }

  private calculateHash(index: number, timestamp: Date, data: any, prevHash: string): string {
    const dataString = `${index}${timestamp.toISOString()}${JSON.stringify(data)}${prevHash}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // Participant operations
  async getParticipant(id: string): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async getParticipantByUsername(username: string): Promise<Participant | undefined> {
    return Array.from(this.participants.values()).find(
      (participant) => participant.username === username
    );
  }

  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = randomUUID();
    const participant: Participant = { 
      id,
      role: insertParticipant.role,
      username: insertParticipant.username,
      status: insertParticipant.status || 'active',
      email: insertParticipant.email || null,
      createdAt: new Date()
    };
    this.participants.set(id, participant);
    return participant;
  }

  async getAllParticipants(): Promise<Participant[]> {
    return Array.from(this.participants.values());
  }

  async getParticipantStats(): Promise<ParticipantStats> {
    const participants = Array.from(this.participants.values());
    const stats = participants.reduce((acc, p) => {
      switch (p.role) {
        case 'manufacturer': acc.manufacturers++; break;
        case 'shipper': acc.shippers++; break;
        case 'retailer': acc.retailers++; break;
      }
      return acc;
    }, { manufacturers: 0, shippers: 0, retailers: 0, total: 0 });
    
    stats.total = participants.length;
    return stats;
  }

  // Blockchain operations
  async addBlock(data: BlockchainData): Promise<Block> {
    const blocksArray = Array.from(this.blocks.values()).sort((a, b) => a.index - b.index);
    const lastBlock = blocksArray[blocksArray.length - 1];
    
    this.blockIndex++;
    const timestamp = new Date();
    const hash = this.calculateHash(this.blockIndex, timestamp, data, lastBlock.hash);
    
    const block: Block = {
      id: randomUUID(),
      index: this.blockIndex,
      timestamp,
      data: data as any,
      prevHash: lastBlock.hash,
      hash
    };
    
    this.blocks.set(block.id, block);
    return block;
  }

  async getBlockchain(): Promise<Block[]> {
    return Array.from(this.blocks.values()).sort((a, b) => a.index - b.index);
  }

  async getGenesisBlock(): Promise<Block> {
    return Array.from(this.blocks.values()).find(block => block.index === 0)!;
  }

  async getBlock(id: string): Promise<Block | undefined> {
    return this.blocks.get(id);
  }

  // Asset operations
  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = randomUUID();
    const now = new Date();
    const asset: Asset = { 
      id,
      name: insertAsset.name,
      assetId: insertAsset.assetId,
      category: insertAsset.category || null,
      currentStatus: insertAsset.currentStatus || 'created',
      currentLocation: insertAsset.currentLocation || null,
      batch: insertAsset.batch || null,
      createdAt: now,
      updatedAt: now
    };
    this.assets.set(id, asset);
    return asset;
  }

  async getAsset(assetId: string): Promise<Asset | undefined> {
    return Array.from(this.assets.values()).find(asset => asset.assetId === assetId);
  }

  async getAllAssets(): Promise<Asset[]> {
    return Array.from(this.assets.values());
  }

  async updateAssetStatus(assetId: string, status: string, location?: string): Promise<Asset | undefined> {
    const asset = await this.getAsset(assetId);
    if (!asset) return undefined;
    
    asset.currentStatus = status;
    if (location) asset.currentLocation = location;
    asset.updatedAt = new Date();
    
    this.assets.set(asset.id, asset);
    return asset;
  }

  // Event operations
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = { 
      id,
      action: insertEvent.action,
      timestamp: new Date(),
      metadata: insertEvent.metadata || {},
      assetId: insertEvent.assetId || null,
      blockId: insertEvent.blockId || null,
      participantId: insertEvent.participantId || null,
      location: insertEvent.location || null
    };
    this.events.set(id, event);
    return event;
  }

  async getEventsByAsset(assetId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => event.assetId === assetId);
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const assets = Array.from(this.assets.values());
    const events = Array.from(this.events.values());
    const participants = Array.from(this.participants.values());
    
    return {
      totalAssets: assets.length,
      totalEvents: events.length,
      activeParticipants: participants.filter(p => p.status === 'active').length,
      chainIntegrity: 100 // Always 100% for this simple implementation
    };
  }
}

export const storage = new MemStorage();
