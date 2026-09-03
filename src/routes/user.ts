import { Hono } from "hono";
import { signinInput, signupInput } from '@gayathrichinda/medium-common';
import { sign } from 'hono/jwt';
import { prisma } from "../../prisma/lib/prisma";

async function getPrisma() {
  try {
    const mod = await import('../../prisma/lib/prisma');
    return mod.prisma;
  } catch (error) {
    console.error('Prisma failed to initialize in Hono worker:', error);
    return null;
  }
}

export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
    }
}>();

userRouter.post('/signup',async (c) => {
    const body = await c.req.json();
    const {success} = signupInput.safeParse(body);
    if(!success){
      c.status(411);
      return c.json({
        message: "Inputs not correct"
      })
    }
    //sanatize
    
  
    //check for duplicate mail
    const prisma = await getPrisma();
    if (!prisma) {
      c.status(503);
      return c.json({ message: 'Database is not available in this Hono worker runtime.' });
    }

    try{

        const user1 = await prisma.user.findFirst({
        where:{
          username: body.username,
          password: body.password,
          
        }
      })
  
      if(user1){
        c.status(403);
        return c.json({
          message: 'user already exists'
        })
      }
        const user = await prisma.user.create({
          data:{
            username: body.username,
            password: body.password,
            name: body.name
        }
        })
    const jwt = await sign({
      id: user.id
    }, c.env.JWT_SECRET);

    
    return c.text(jwt)

    }catch(e){
      console.error('Signup failed:', e);
      c.status(500);
      return c.json({ message: 'Unable to create account' })
    }
  
    
  })


userRouter.post('/signin', async (c) => {
    const body = await c.req.json();
    const {success} = signinInput.safeParse(body);
    if(!success){
      c.status(411);
      return c.json({
        message: "Inputs not correct"
      })
    }
   
  
    //check for duplicate mail
    try{
      const user = await prisma.user.findFirst({
        where:{
          username: body.username,
          password: body.password,
          
        }
      })
  
      if(!user){
        c.status(403);
        return c.json({
          message: 'invalid activity'
        })
      }
  
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_SECRET);

      return c.text(jwt)
    }catch(e){
      console.error('Signin failed:', e);
      c.status(500);
      return c.json({ message: 'Unable to sign in' })
    }
    
  })
  