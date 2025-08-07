import request from 'supertest';
import app from '../../app';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import dotenv from 'dotenv';

dotenv.config();

jest.setTimeout(30000);

describe("User Auth and Profile API", () => {
  const testUser = {
    name: "Test User",
    email: "test.user@example.com",
    password: "password123",
  };
  let token: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGO_URI!);
      } catch (error) {
        console.error("!!! DATABASE CONNECTION FAILED !!!");
        console.error("Please check your MONGO_URI in the .env file.");
        console.error(error);
        throw error;
      }
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testUser.email });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // 1. Register Tests
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);
      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty("email", testUser.email);
    });

    it("should not register a user with an existing email", async () => {
      await request(app).post("/api/auth/register").send(testUser);
      const res = await request(app).post("/api/auth/register").send(testUser);
      expect(res.statusCode).toBe(500);
    });

    it("should not register a user without a password", async () => {
      const userWithoutPassword = { ...testUser };
      delete (userWithoutPassword as any).password;
      const res = await request(app)
        .post("/api/auth/register")
        .send(userWithoutPassword);
      expect(res.statusCode).toBe(500);
    });
  });

  // 2. Login Tests
  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Ensure the user exists before login tests
      await request(app).post("/api/auth/register").send(testUser);
    });

    it("should login successfully with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      token = res.body.accessToken; // Save token for subsequent tests
    });

    it("should not login with incorrect password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: "wrongpassword" });
      expect(res.statusCode).toBe(500);
    });

    it("should not login with a non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nouser@example.com", password: "somepassword" });
      expect(res.statusCode).toBe(500);
    });
  });

  // 3. Get User Profile Tests
  describe("GET /api/user/me", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(testUser);
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password });
      token = loginRes.body.accessToken;
    });

    it("should get user profile with a valid token", async () => {
      const res = await request(app)
        .get("/api/user/me")
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty("email", testUser.email);
    });

    it("should return 401 if no token is provided because route requires auth", async () => {
      const res = await request(app).get("/api/user/me");
      expect(res.statusCode).toBe(401);
    });
  });

  // 4. Update User Profile Tests
  describe("PUT /api/user/me", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(testUser);
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password });
      token = loginRes.body.accessToken;
    });

    it("should update the user profile successfully", async () => {
      const newName = "Updated Test User";
      const res = await request(app)
        .put("/api/user/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: newName });

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty("name", newName);

      // Verify the change in the database
      const userInDb = await User.findOne({ email: testUser.email });
      expect(userInDb?.name).toBe(newName);
    });

    it("should return 401 if no token is provided", async () => {
      const res = await request(app)
        .put("/api/user/me")
        .send({ name: "This should not work" });
      expect(res.statusCode).toBe(401);
    });
  });
});