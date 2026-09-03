import { Hono } from 'hono'
import { blogRouter } from './routes/blog';
import { userRouter } from './routes/user';
import { cors } from 'hono/cors';
import { getPrisma, type Prisma } from '../prisma/lib/prisma';

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    prisma: Prisma;
  };
}>()

app.use('/*',cors());
app.use('/*', async (c, next) => {
  c.set('prisma', getPrisma(c.env.DATABASE_URL));
  await next();
});
app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogRouter);




export default app