import { 
  type Block, type InsertBlock, 
  type Participant, type InsertParticipant,
  type Asset, type InsertAsset,
  type Event, type InsertEvent,
  type BlockchainData, type ParticipantStats, type DashboardStats,
  type Property, type InsertProperty,
  type Payment, type InsertPayment,
  type Ownership, type InsertOwnership
} from "@shared/schema";
import { randomUUID } from "crypto";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Participant operations
  getParticipant(id: string): Promise<Participant | undefined>;
  getParticipantByUsername(username: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  getAllParticipants(): Promise<Participant[]>;
  getParticipantStats(): Promise<ParticipantStats>;
  updateParticipantPassword(id: string, passwordHash: string): Promise<void>;
  
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

// Detroit Civic Storage Interface Extension
export interface IDetroitCivicStorage extends IStorage {
  // Property management
  createProperty(property: InsertProperty): Promise<Property>;
  getProperty(propertyId: string): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  getPropertiesByOwner(ownerId: string): Promise<Property[]>;
  updateProperty(id: string, updates: Partial<Property>): Promise<void>;

  // Payments
  recordPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByProperty(propertyId: string): Promise<Payment[]>;
  getPaymentsByPayer(payerId: string): Promise<Payment[]>;

  // Ownership
  addOwnership(ownership: InsertOwnership): Promise<Ownership>;
  getOwnership(id: string): Promise<Ownership | undefined>;
  getOwners(propertyId: string): Promise<Ownership[]>;
  getOwnerships(ownerId: string): Promise<Ownership[]>;
}

export class MemStorage implements IDetroitCivicStorage {
  private blocks: Map<string, Block>;
  private participants: Map<string, Participant>;
  private assets: Map<string, Asset>;
  private events: Map<string, Event>;
  private properties: Map<string, Property>;
  private payments: Map<string, Payment>;
  private ownerships: Map<string, Ownership>;
  private blockIndex: number;

  constructor() {
    this.blocks = new Map();
    this.participants = new Map();
    this.assets = new Map();
    this.events = new Map();
    this.properties = new Map();
    this.payments = new Map();
    this.ownerships = new Map();
    this.blockIndex = 0;
    this.initializeGenesis();
    this.initializeTestData();
    this.initializeDetroitTestData();
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

  private async initializeTestData() {
    // Add sample participants
    const manufacturer = await this.createParticipant({
      username: 'AcmeCorp',
      role: 'manufacturer',
      email: 'contact@acmecorp.com'
    });
    // Set default password for testing
    await this.updateParticipantPassword(manufacturer.id, bcrypt.hashSync('demo123', 10));

    const shipper = await this.createParticipant({
      username: 'GlobalLogistics',
      role: 'shipper',
      email: 'ops@globallogistics.com'
    });
    await this.updateParticipantPassword(shipper.id, bcrypt.hashSync('demo123', 10));

    const retailer = await this.createParticipant({
      username: 'TechMart',
      role: 'retailer',
      email: 'procurement@techmart.com'
    });
    await this.updateParticipantPassword(retailer.id, bcrypt.hashSync('demo123', 10));

    // Add sample assets with events
    const asset1 = await this.createAsset({
      assetId: 'PRD-2024-001',
      name: 'Industrial Sensor Module',
      category: 'Electronics',
      currentStatus: 'manufactured',
      currentLocation: 'Factory Floor A',
      batch: 'BATCH-001'
    });

    const asset2 = await this.createAsset({
      assetId: 'PRD-2024-002',
      name: 'Smart Gateway Device',
      category: 'IoT',
      currentStatus: 'shipped',
      currentLocation: 'Distribution Center',
      batch: 'BATCH-002'
    });

    // Create blockchain events for the assets
    const manufacturingData: BlockchainData = {
      user: 'AcmeCorp',
      role: 'manufacturer',
      action: 'manufactured',
      asset_id: 'PRD-2024-001',
      meta: { location: 'Factory Floor A', batch: 'BATCH-001', quality_check: 'passed' }
    };

    const block1 = await this.addBlock(manufacturingData);
    await this.createEvent({
      blockId: block1.id,
      participantId: manufacturer.id,
      assetId: asset1.id,
      action: 'manufactured',
      location: 'Factory Floor A',
      metadata: { batch: 'BATCH-001', quality_check: 'passed' }
    });

    const shippingData: BlockchainData = {
      user: 'GlobalLogistics',
      role: 'shipper',
      action: 'shipped',
      asset_id: 'PRD-2024-002',
      meta: { location: 'Distribution Center', tracking_number: 'TRK-789456', carrier: 'Express Freight' }
    };

    const block2 = await this.addBlock(shippingData);
    await this.createEvent({
      blockId: block2.id,
      participantId: shipper.id,
      assetId: asset2.id,
      action: 'shipped',
      location: 'Distribution Center',
      metadata: { tracking_number: 'TRK-789456', carrier: 'Express Freight' }
    });

    // Update asset statuses
    await this.updateAssetStatus('PRD-2024-002', 'shipped', 'Distribution Center');
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

  async updateParticipantPassword(id: string, passwordHash: string): Promise<void> {
    const participant = this.participants.get(id);
    if (participant) {
      // Add password field to participant if it doesn't exist
      (participant as any).passwordHash = passwordHash;
      this.participants.set(id, participant);
    }
  }

  // ========================
  // DETROIT CIVIC METHODS
  // ========================

  async createProperty(property: InsertProperty): Promise<Property> {
    const newProperty: Property = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...property
    };
    this.properties.set(newProperty.id, newProperty);
    return newProperty;
  }

  async getProperty(propertyId: string): Promise<Property | undefined> {
    return this.properties.get(propertyId);
  }

  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(p => p.ownerId === ownerId);
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<void> {
    const property = this.properties.get(id);
    if (property) {
      const updatedProperty = { ...property, ...updates, updatedAt: new Date() };
      this.properties.set(id, updatedProperty);
    }
  }

  async recordPayment(payment: InsertPayment): Promise<Payment> {
    const newPayment: Payment = {
      id: randomUUID(),
      timestamp: new Date(),
      ...payment
    };
    this.payments.set(newPayment.id, newPayment);
    return newPayment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByProperty(propertyId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.propertyId === propertyId);
  }

  async getPaymentsByPayer(payerId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.payerId === payerId);
  }

  async addOwnership(ownership: InsertOwnership): Promise<Ownership> {
    const newOwnership: Ownership = {
      id: randomUUID(),
      acquiredAt: new Date(),
      ...ownership
    };
    this.ownerships.set(newOwnership.id, newOwnership);
    return newOwnership;
  }

  async getOwnership(id: string): Promise<Ownership | undefined> {
    return this.ownerships.get(id);
  }

  async getOwners(propertyId: string): Promise<Ownership[]> {
    return Array.from(this.ownerships.values()).filter(o => o.propertyId === propertyId);
  }

  async getOwnerships(ownerId: string): Promise<Ownership[]> {
    return Array.from(this.ownerships.values()).filter(o => o.ownerId === ownerId);
  }

  private async initializeDetroitTestData() {
    // Create Detroit City Government participant
    const detroitGov = await this.createParticipant({
      username: "detroit_city_gov",
      role: "government",
      company: "City of Detroit",
      email: "blockchain@detroitmi.gov",
      passwordHash: await bcrypt.hash("detroit2025", 10)
    });

    // Create sample property owner - Justin Owenu
    const propertyOwner = await this.createParticipant({
      username: "justin_owenu",
      role: "resident",
      company: "Detroit Resident",
      email: "justin.owenu@example.com",
      passwordHash: await bcrypt.hash("demo123", 10)
    });

    // Create sample properties
    const property1 = await this.createProperty({
      propertyId: "DET-0012345",
      address: "1234 Woodward Ave, Detroit, MI 48201",
      ownerId: propertyOwner.id,
      assessedValue: 25000000, // $250,000 in cents
      status: "active",
      taxOwed: 180000, // $1,800 in cents
      metadata: {
        parcelInfo: "Lot 23 Block 7",
        year: 2025,
        neighborhood: "Downtown Detroit",
        propertyType: "Residential",
        squareFootage: 1800
      }
    });

    const property2 = await this.createProperty({
      propertyId: "DET-0012346",
      address: "5678 Jefferson Ave, Detroit, MI 48207",
      ownerId: detroitGov.id,
      assessedValue: 45000000, // $450,000 in cents
      status: "active",
      taxOwed: 0, // Government property
      metadata: {
        parcelInfo: "Lot 15 Block 12",
        year: 2025,
        neighborhood: "Riverfront",
        propertyType: "Municipal Building",
        squareFootage: 3500
      }
    });

    // Sample payment for property taxes
    await this.recordPayment({
      propertyId: property1.id,
      payerId: propertyOwner.id,
      txHash: "0xABC123DEF456789",
      paymentMethod: "usdc",
      amount: 90000, // $900 partial payment
      status: "completed",
      context: {
        reason: "2025 Property Tax Payment - Partial",
        blockchainNetwork: "Ethereum",
        gasUsed: "21000"
      }
    });

    // Sample ownership record
    await this.addOwnership({
      propertyId: property1.id,
      ownerId: propertyOwner.id,
      fraction: "1.0",
      transferTx: "0xDEF456ABC123789",
      metadata: {
        note: "Full ownership transfer via blockchain",
        purchasePrice: 25000000,
        transferDate: "2025-01-15"
      }
    });
  }
}

export const storage = new MemStorage();
