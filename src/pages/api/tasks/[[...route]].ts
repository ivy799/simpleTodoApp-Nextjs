import { Hono } from 'hono';
import { handle } from '@hono/node-server/vercel';
import type { PageConfig } from 'next';
import { db } from '../../../db';
import { tasks } from '../../../db/schema';

export const config: PageConfig = {
  runtime: 'nodejs',
  api: {
    bodyParser: false,
  },
};

const App = new Hono().basePath('/api/tasks');

// GET /api/tasks
App.get('/', async (c) => {
  try {
    const allTasks = await db.select().from(tasks);
    return c.json({ success: true, data: allTasks }, 200);
  } catch (error) {
    console.error('🚨 Error GET /api/tasks:', error);
    return c.json({ success: false, message: 'Database error' }, 500);
  }
});

// POST /api/tasks
App.post('/', async (c) => {
  try {
    const { title } = await c.req.json();
    const newTask = await db.insert(tasks).values({ title }).returning();
    return c.json({ success: true, data: newTask }, 201);
  } catch (error) {
    console.error('🚨 Error POST /api/tasks:', error);
    return c.json({ success: false, message: 'Gagal membuat task' }, 500);
  }
});

export default handle(App);