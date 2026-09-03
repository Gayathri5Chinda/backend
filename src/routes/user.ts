import { Hono } from "hono";
import { signinInput, signupInput } from "@gayathrichinda/medium-common";
import { sign } from "hono/jwt";
import type { Prisma } from "../../prisma/lib/prisma";

export const userRouter = new Hono<{
  Bindings: { DATABASE_URL: string; JWT_SECRET: string };
  Variables: { prisma: Prisma };
}>();

userRouter.post("/signup", async (c) => {
  const body = await c.req.json();
  if (!signupInput.safeParse(body).success) {
    c.status(411);
    return c.json({ message: "Inputs not correct" });
  }
  try {
    const prisma = c.get("prisma");
    const existing = await prisma.user.findFirst({ where: { username: body.username, password: body.password } });
    if (existing) {
      c.status(403);
      return c.json({ message: "user already exists" });
    }
    const user = await prisma.user.create({ data: { username: body.username, password: body.password, name: body.name } });
    return c.text(await sign({ id: user.id }, c.env.JWT_SECRET));
  } catch (error) {
    console.error("Signup failed:", error);
    c.status(500);
    return c.json({ message: "Unable to create account" });
  }
});

userRouter.post("/signin", async (c) => {
  const body = await c.req.json();
  if (!signinInput.safeParse(body).success) {
    c.status(411);
    return c.json({ message: "Inputs not correct" });
  }
  try {
    const prisma = c.get("prisma");
    const user = await prisma.user.findFirst({ where: { username: body.username, password: body.password } });
    if (!user) {
      c.status(403);
      return c.json({ message: "invalid activity" });
    }
    return c.text(await sign({ id: user.id }, c.env.JWT_SECRET));
  } catch (error) {
    console.error("Signin failed:", error);
    c.status(500);
    return c.json({ message: "Unable to sign in" });
  }
});
