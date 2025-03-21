import { Hono } from 'hono';
import { handle } from '@hono/node-server/vercel';
import type { PageConfig } from 'next';
import { db } from '../../../db';
import { tasks } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const config: PageConfig = {
  runtime: 'nodejs',
  api: { 
    bodyParser: false,
  },
};

const App = new Hono().basePath('/api/tasks');


// CREATE
App.post('/', async (c) => {
  try {
    const { title, description } = await c.req.json();
    const newTask = await db.insert(tasks).values({ title, description }).returning();
    return c.json({ success: true, data: newTask }, 201);
  } catch (error) {
    console.error('🚨 Error POST /api/tasks:', error);
    return c.json({ success: false, message: 'Gagal membuat task' }, 500);
  }
});

// READ
App.get('/', async (c) => {
  try {
    const allTasks = await db.select().from(tasks);
    return c.json({ success: true, data: allTasks }, 200);
  } catch (error) {
    console.error('🚨 Error GET /api/tasks:', error);
    return c.json({ success: false, message: 'Database error' }, 500);
  }
});

// UPDATE
App.put('/:id',async(c)=>{
  try{
    const id = Number(c.req.param('id'));
    const {title,description} = await c.req.json();
    const updateTask = await db.update(tasks).set({title,description}).where(eq(tasks.id, id)).returning();
    return c.json({success:true,data:updateTask},200);
  }catch(error){
    console.error('🚨 Error PUT /api/tasks:',error);
    return c.json({success:false,message:'Gagal update task'},500);
  }
})

// DELETE
App.delete('/:id', async (c)=>{
  try{
    const id = Number(c.req.param('id'));
    const deleteTask = await db.delete(tasks).where(eq(tasks.id,id)).returning();
    return c.json({success:true,data:deleteTask},200);
  }catch(error){
    console.error('🚨 Error DELETE /api/tasks:',error);
    return c.json({success:false,message:'Gagal delete task'},500);
  }
})

export default handle(App);