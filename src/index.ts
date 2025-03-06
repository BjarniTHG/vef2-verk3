import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const app = new Hono()

app.get('/', async (c) => {
  const L = await prisma.category.findMany();
  console.log(L);
  return c.text('Hello Hono!')
})

app.get('/categories', async (c) => {
  try {
    const categories = await prisma.category.findMany();
    return c.json(categories, 200);
  } catch(e) {
    console.log(e);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})

app.get('/categories/:slug', async (c) => {
  const { slug } = c.req.param();
  try {
    const category = await prisma.category.findUnique({
      where: {
        slug: slug
      }
    });
    
    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }
    
    return c.json(category, 200);
  } catch(e) {
    console.log(e);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})

app.post('/category', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.name || !body.slug || typeof body.name !== 'string' || typeof body.slug !== 'string') {
      return c.json({ error: 'Name and slug are required and must be strings' }, 400);
    }

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
      },
    });
    
    return c.json(category, 201);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.patch('/category/:slug', async (c) => {
  try {
    const { slug } = c.req.param();
    const body = await c.req.json();

    if (!body.name || typeof body.name !== 'string') {
      return c.json({ error: 'Name is required and must be a string' }, 400);
    }

    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });

    if (!existingCategory) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const updatedCategory = await prisma.category.update({
      where: { slug },
      data: { name: body.name }
    });

    return c.json(updatedCategory, 200);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.delete('/category/:slug', async (c) => {
  try {
    const { slug } = c.req.param();

    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });

    if (!existingCategory) {
      return c.json({ error: 'Category not found' }, 404);
    }

    await prisma.category.delete({
      where: { slug }
    });

    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
