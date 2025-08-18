import request from "supertest";
import app from "../app";
import { describe, it, expect } from "vitest";

describe("Auth Module E2E", () => {
  let refreshToken: string;
  let accessToken: string;

  it("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Alice5",
        email: "alice5@example.com",
        password: "Secret123",
      })
      .expect(201);

    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("logs in user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice5@example.com", password: "Secret123" })
      .expect(200);

    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });

  it("gets current user with access token", async () => {
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.user.email).toBe("alice5@example.com");
  });

  it("refreshes token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });
});
