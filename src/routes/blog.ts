import { Hono } from "hono";
import { createBlogInput, udpateBlogInput } from "@gayathrichinda/medium-common";
import { prisma } from "../../prisma/lib/prisma";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
    },
    Variables: {
        userId: any;
    }
}>();


blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    try{
        const user = await verify(token, c.env.JWT_SECRET, "HS256");
        if(user){
           c.set("userId", user.id);
           await next();
        }else{
           c.status(403);
           return c.json({ 
            message: "you are not logged in"
        })
        }
    }catch(e){
        c.status(403);
        return c.json({ 
            message: "you are not logged in"
        })
    }
})

blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const {success} = createBlogInput.safeParse(body);
    if(!success){
        c.status(411);
        return c.json({ 
            message: "Inputs not correct"
        })
    }
    const authorId = c.get("userId");

    const blog = await prisma.blog.create({
        data:{
            title: body.title,
            content: body.content,
            authorId: Number(authorId)
        }
    })

    return c.json({
        id: blog.id
    })
})
  
blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const {success} = udpateBlogInput.safeParse(body);
    if(!success){
        c.status(411);
        return c.json({ 
            message: "Inputs not correct"
        })
    }
    const authorId = c.get("userId");


    const blog = await prisma.blog.update({
        where:{
            id: body.id
        },
        data:{
            title: body.title,
            content: body.content,
            authorId: Number(authorId)
        }
    })

    return c.json({
        id: blog.id
    })
})

blogRouter.get('/bulk', async (c) => {
    
    const blogs = await prisma.blog.findMany({
        select: {
            content:true,
            title: true,
            id: true,
            author: {
                select: {
                    name: true
                }
            }
        }
    });

    return c.json({
        blogs
    })
})

  
blogRouter.get('/:id', async (c) => {
    const id = c.req.param("id");
    

    //need to use try else the server will crash
    try{
        const blog = await prisma.blog.findFirst({
            where: {
                id: Number(id)
            },
            select: {
                id: true,
                title: true,
                content: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
        })
        return c.json({
            blog
        });

    }catch(e){
        c.status(411);
        return c.json({
            message: "Error while fetching blog post"
        });
    }

    
})
  
//pagination
