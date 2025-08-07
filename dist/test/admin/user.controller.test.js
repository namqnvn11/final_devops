"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../../models/User");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
jest.setTimeout(30000);
describe("User Auth and Profile API", () => {
    const testUser = {
        name: "Test User",
        email: "test.user@example.com",
        password: "password123",
    };
    let token;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState === 0) {
            try {
                yield mongoose_1.default.connect(process.env.MONGO_URI);
            }
            catch (error) {
                console.error("!!! DATABASE CONNECTION FAILED !!!");
                console.error("Please check your MONGO_URI in the .env file.");
                console.error(error);
                throw error;
            }
        }
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield User_1.User.deleteMany({ email: testUser.email });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    describe("POST /api/auth/register", () => {
        it("should register a new user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testUser);
            expect(res.statusCode).toBe(201);
            expect(res.body.user).toHaveProperty("email", testUser.email);
        }));
        it("should not register a user with an existing email", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testUser);
            const res = yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testUser);
            expect(res.statusCode).toBe(500);
        }));
        it("should not register a user without a password", () => __awaiter(void 0, void 0, void 0, function* () {
            const userWithoutPassword = Object.assign({}, testUser);
            delete userWithoutPassword.password;
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/register")
                .send(userWithoutPassword);
            expect(res.statusCode).toBe(500);
        }));
    });
    describe("POST /api/auth/login", () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testUser);
        }));
        it("should login successfully with correct credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: testUser.password });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("accessToken");
            token = res.body.accessToken;
        }));
        it("should not login with incorrect password", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: "wrongpassword" });
            expect(res.statusCode).toBe(500);
        }));
        it("should not login with a non-existent email", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/login")
                .send({ email: "nouser@example.com", password: "somepassword" });
            expect(res.statusCode).toBe(500);
        }));
    });
    describe("GET /api/user/me", () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testUser);
            const loginRes = yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: testUser.password });
            token = loginRes.body.accessToken;
        }));
        it("should get user profile with a valid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/user/me")
                .set("Authorization", `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.user).toHaveProperty("email", testUser.email);
        }));
        it("should return 401 if no token is provided because route requires auth", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).get("/api/user/me");
            expect(res.statusCode).toBe(401);
        }));
    });
    describe("PUT /api/user/me", () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testUser);
            const loginRes = yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/login")
                .send({ email: testUser.email, password: testUser.password });
            token = loginRes.body.accessToken;
        }));
        it("should update the user profile successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const newName = "Updated Test User";
            const res = yield (0, supertest_1.default)(app_1.default)
                .put("/api/user/me")
                .set("Authorization", `Bearer ${token}`)
                .send({ name: newName });
            expect(res.statusCode).toBe(200);
            expect(res.body.user).toHaveProperty("name", newName);
            const userInDb = yield User_1.User.findOne({ email: testUser.email });
            expect(userInDb === null || userInDb === void 0 ? void 0 : userInDb.name).toBe(newName);
        }));
        it("should return 401 if no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .put("/api/user/me")
                .send({ name: "This should not work" });
            expect(res.statusCode).toBe(401);
        }));
    });
});
