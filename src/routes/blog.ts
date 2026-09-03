import { Hono } from "hono";
import { createBlogInput, udpateBlogInput } from "@gayathrichinda/medium-common";
import type { Prisma } from "../../prisma/lib/prisma";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: { DATABASE_URL: string; JWT_SECRET: string };
  Variables: { userId: any; prisma: Prisma };
}>();

blogRouter.use("/*", async (c, next) => {
  const header = c.req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  try {
    const user = await verify(token, c.env.JWT_SECRET, "HS256");
    if (!user) throw new Error("Unauthenticated");
    c.set("userId", user.id);
    await next();
  } catch {
    c.status(403);
    return c.json({ message: "you are not logged in" });
  }
});

blogRouter.post("/", async (c) => {
  const body = await c.req.json();
  if (!createBlogInput.safeParse(body).success) {
    c.status(411);
    return c.json({ message: "Inputs not correct" });
  }
  const blog = await c.get("prisma").blog.create({ data: { title: body.title, content: body.content, authorId: Number(c.get("userId")) } });
  return c.json({ id: blog.id });
});

blogRouter.put("/", async (c) => {
  const body = await c.req.json();
  if (!udpateBlogInput.safeParse(body).success) {
    c.status(411);
    return c.json({ message: "Inputs not correct" });
  }
  const blog = await c.get("prisma").blog.update({ where: { id: body.id }, data: { title: body.title, content: body.content, authorId: Number(c.get("userId")) } });
  return c.json({ id: blog.id });
});

blogRouter.get("/bulk", async (c) => {
  const blogs = await c.get("prisma").blog.findMany({ select: { content: true, title: true, id: true, author: { select: { name: true } } } });
  return c.json({ blogs });
});

blogRouter.get("/:id", async (c) => {
  try {
    const blog = await c.get("prisma").blog.findFirst({ where: { id: Number(c.req.param("id")) }, select: { id: true, title: true, content: true, author: { select: { name: true } } } });
    return c.json({ blog });
  } catch {
    c.status(411);
    return c.json({ message: "Error while fetching blog post" });
  }
});
