import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import type { PageConfig } from "next";
import { db } from "../../../db";
import { tasks, attachments } from "../../../db/schema"; // Pastikan import schema attachments
import { eq } from "drizzle-orm";
import { minioClient } from "../../../lib/minioClient";

export const config: PageConfig = {
  runtime: "nodejs",
  api: {
    bodyParser: false, // Tetap nonaktifkan untuk handle form-data
  },
};

const App = new Hono().basePath("/api/tasks");

// CREATE TASK DENGAN ATTACHMENT OPSIONAL
App.post("/", async (c) => {
  try {
    const formData = await c.req.formData();
    
    // Ambil data dari form-data
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const file = formData.get("attachment") as File | null;

    // Validasi input
    if (!title) {
      return c.json({ success: false, message: "Judul harus diisi" }, 400);
    }

    // Mulai transaksi database
    const newTask = await db.transaction(async (tx) => {
      // Buat task baru
      const [task] = await tx
        .insert(tasks)
        .values({ title, description })
        .returning();

      // Jika ada file attachment
      if (file && file.size > 0) {
        const bucketName = "todo-app";
        const fileName = `${Date.now()}-${file.name}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload ke MinIO
        await minioClient.putObject(
          bucketName,
          fileName,
          buffer,
          buffer.length,
          { "Content-Type": file.type }
        );

        // Simpan data attachment
        await tx.insert(attachments).values({
          taskId: task.id,
          fileName,
          fileUrl: `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${fileName}`,
          fileType: file.type,
        });
      }

      return task;
    });

    return c.json(
      { 
        success: true, 
        data: {
          ...newTask,
          attachment: !!file // Tanda apakah ada attachment
        } 
      },
      201
    );

  } catch (error) {
    console.error("🚨 Error POST /api/tasks:", error);
    return c.json(
      { success: false, message: "Gagal membuat task" },
      500
    );
  }
});

// UPDATE: GET, PUT, DELETE (SESUAIKAN DENGAN UUID)
App.get("/:id", async (c) => {
  try {
    const id = c.req.param("id"); // Gunakan UUID bukan number
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));

    return task[0] 
      ? c.json({ success: true, data: task[0] }, 200)
      : c.json({ success: false, message: "Task tidak ditemukan" }, 404);
  } catch (error) {
    console.error("🚨 Error GET /api/tasks/:id:", error);
    return c.json({ success: false, message: "Database error" }, 500);
  }
});

App.put("/:id", async (c) => {
  try {
    const id = c.req.param("id"); // Gunakan UUID
    const { title, description: desc } = await c.req.parseBody();
    const description = typeof desc === 'string' ? desc : '';
    if (typeof title !== 'string') {
      return c.json({ success: false, message: "Invalid title" }, 400);
    }
    
    const [updateTask] = await db
      .update(tasks)
      .set({ title, description })
      .where(eq(tasks.id, id))
      .returning();

    return updateTask
      ? c.json({ success: true, data: updateTask }, 200)
      : c.json({ success: false, message: "Task tidak ditemukan" }, 404);
  } catch (error) {
    console.error("🚨 Error PUT /api/tasks:", error);
    return c.json({ success: false, message: "Gagal update task" }, 500);
  }
});

App.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id"); // Gunakan UUID
    const [deleteTask] = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    return deleteTask
      ? c.json({ success: true, data: deleteTask }, 200)
      : c.json({ success: false, message: "Task tidak ditemukan" }, 404);
  } catch (error) {
    console.error("🚨 Error DELETE /api/tasks:", error);
    return c.json({ success: false, message: "Gagal delete task" }, 500);
  }
});

// Hapus endpoint /upload terpisah karena sudah terintegrasi

export default handle(App);