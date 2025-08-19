import request from "supertest";
import { Express } from "express";

// Mock the storage to avoid conflicts with the main application
const mockStorage = {
  participants: new Map(),
  assets: new Map(),
  
  async getParticipantByUsername(username: string) {
    return Array.from(this.participants.values()).find((p: any) => p.username === username);
  },
  
  async createParticipant(data: any) {
    const id = `test-${Date.now()}`;
    const participant = { ...data, id, createdAt: new Date() };
    this.participants.set(id, participant);
    return participant;
  },
  
  async updateParticipantPassword(id: string, passwordHash: string) {
    const participant = this.participants.get(id);
    if (participant) {
      (participant as any).passwordHash = passwordHash;
    }
  },
  
  async getAllAssets() {
    return Array.from(this.assets.values());
  }
};

describe("OriginLedger Auth & Asset API", () => {
  let app: Express;
  let token = "";
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: "Testpass123",
    email: "test@originledger.com",
    role: "manufacturer"
  };

  beforeAll(async () => {
    // Import Express app for testing
    const serverModule = await import("../server/index");
    app = (serverModule as any).default || serverModule;
  });

  describe("User Registration", () => {
    it("should register a new user with valid data", async () => {
      const response = await request(app)
        .post("/api/register")
        .send({
          user: testUser.username,
          password: testUser.password,
          email: testUser.email,
          role: testUser.role
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain("registered successfully");
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user.role).toBe(testUser.role);
      expect(response.body.token).toBeDefined();
    });

    it("should reject registration with invalid data", async () => {
      const response = await request(app)
        .post("/api/register")
        .send({
          user: "xy", // Too short
          password: "123", // Too short
          email: "invalid-email", // Invalid email
          role: "invalid-role" // Invalid role
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it("should reject duplicate username", async () => {
      // Try to register the same user again
      const response = await request(app)
        .post("/api/register")
        .send({
          user: testUser.username,
          password: testUser.password,
          email: "different@email.com",
          role: testUser.role
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("User already exists");
      expect(response.body.code).toBe("USER_EXISTS");
    });
  });

  describe("User Authentication", () => {
    it("should login with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe(testUser.username);
      
      token = response.body.token;
    });

    it("should reject login with incorrect credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: "WrongPassword"
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
      expect(response.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("should reject login with missing credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("Authenticated Endpoints", () => {
    it("should access user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.role).toBe(testUser.role);
      expect(response.body.email).toBe(testUser.email);
    });

    it("should reject access without token", async () => {
      const response = await request(app)
        .get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("No token provided");
      expect(response.body.code).toBe("UNAUTHORIZED");
    });

    it("should reject access with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid or expired token");
      expect(response.body.code).toBe("TOKEN_INVALID");
    });
  });

  describe("Asset API", () => {
    it("should return asset list with pagination", async () => {
      const response = await request(app)
        .get("/api/assets")
        .query({ limit: 5, page: 1 });

      expect(response.status).toBe(200);
      expect(response.body.assets).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it("should filter assets by status", async () => {
      const response = await request(app)
        .get("/api/assets")
        .query({ status: "manufactured" });

      expect(response.status).toBe(200);
      expect(response.body.assets).toBeInstanceOf(Array);
      expect(response.body.filters.status).toBe("manufactured");
    });

    it("should search assets by text", async () => {
      const response = await request(app)
        .get("/api/assets")
        .query({ search: "sensor" });

      expect(response.status).toBe(200);
      expect(response.body.assets).toBeInstanceOf(Array);
      expect(response.body.filters.search).toBe("sensor");
    });

    it("should sort assets", async () => {
      const response = await request(app)
        .get("/api/assets")
        .query({ sortBy: "name", sortOrder: "asc" });

      expect(response.status).toBe(200);
      expect(response.body.assets).toBeInstanceOf(Array);
      expect(response.body.filters.sortBy).toBe("name");
      expect(response.body.filters.sortOrder).toBe("asc");
    });

    it("should validate query parameters", async () => {
      const response = await request(app)
        .get("/api/assets")
        .query({ limit: 200 }); // Exceeds max limit

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("System Health", () => {
    it("should return health status", async () => {
      const response = await request(app)
        .get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.blockchain).toBeDefined();
      expect(response.body.statistics).toBeDefined();
    });
  });

  describe("Blockchain Validation", () => {
    it("should validate blockchain integrity", async () => {
      const response = await request(app)
        .get("/api/chain/validate");

      expect(response.status).toBe(200);
      expect(typeof response.body.valid).toBe("boolean");
      
      if (!response.body.valid) {
        expect(response.body.error).toBeDefined();
        expect(response.body.code).toBeDefined();
      }
    });
  });
});