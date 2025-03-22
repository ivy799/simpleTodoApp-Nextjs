import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import type { PageConfig } from "next";
import { db } from "../../../db";
import { authMiddleware } from "../../../middleware/auth"; 
import jwt from "jsonwebtoken"; 
import { tasks, attachments, users } from "../../../db/schema"; 
import { eq, and } from "drizzle-orm";
import { minioClient } from "../../../lib/minioClient";
import bcrypt from "bcrypt";



export const config: PageConfig = {
	runtime: "nodejs",
	api: {
		bodyParser: false, 
	},
};



const App = new Hono().basePath("/api/tasks");



App.post("/", authMiddleware, async (c) => {
	try {
		const formData = await c.req.formData();

		const user = c.get("user");

		if (!user || !user.id) {
			return c.json({ success: false, message: "Unauthorized" }, 401);
		}

		const title = formData.get("title") as string;
		const description = formData.get("description") as string;
		const file = formData.get("attachment") as File | null;

		if (!title) {
			return c.json({ success: false, message: "Judul harus diisi" }, 400);
		}

		const newTask = await db.transaction(async (tx) => {
			const [task] = await tx
				.insert(tasks)
				.values({ title, description, user_id: user.id })
				.returning();

			if (file && file.size > 0) {
				const bucketName = "todo-app";
				const fileName = `${Date.now()}-${file.name}`;
				const buffer = Buffer.from(await file.arrayBuffer());

				await minioClient.putObject(
					bucketName,
					fileName,
					buffer,
					buffer.length,
					{ "Content-Type": file.type },
				);

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
					attachment: !!file,
				},
			},
			201,
		);
	} catch (error) {
		console.error("🚨 Error POST /api/tasks:", error);
		return c.json({ success: false, message: "Gagal membuat task" }, 500);
	}
});

App.get("/:id", authMiddleware, async (c) => {
	try {
		const user = c.get("user");
		const taskId = c.req.param("id");

		const [task] = await db
			.select()
			.from(tasks)
			.where(and(eq(tasks.id, taskId), eq(tasks.user_id, user.id)));

		if (!task) {
			return c.json(
				{
					success: false,
					message: "Task tidak ditemukan atau tidak memiliki akses",
				},
				404,
			);
		}

		return c.json({ success: true, data: task }, 200);
	} catch (error) {
		console.error("🚨 Error GET /api/tasks/:id:", error);
		return c.json(
			{
				success: false,
				message: "Terjadi kesalahan server",
			},
			500,
		);
	}
});

App.put("/:id",authMiddleware, async (c) => {
	try {
		const id = c.req.param("id");
		const { title, description: desc } = await c.req.json();
		const description = typeof desc === "string" ? desc : "";
		if (typeof title !== "string") {
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

App.delete("/:id", authMiddleware, async (c) => {
    try {
        const user = c.get("user"); // Ambil data user dari middleware
        const taskId = c.req.param("id");

        // 1. Hapus attachment terkait terlebih dahulu
        await db.delete(attachments).where(eq(attachments.taskId, taskId));

        // 2. Hapus task dengan memeriksa kepemilikan user
        const [deletedTask] = await db
            .delete(tasks)
            .where(
                and(
                    eq(tasks.id, taskId),
                    eq(tasks.user_id, user.id) // Hanya hapus task milik user
                )
            )
            .returning();

        if (!deletedTask) {
            return c.json(
                { 
                    success: false, 
                    message: "Task tidak ditemukan atau tidak memiliki akses" 
                },
                404
            );
        }

        return c.json({ success: true, data: deletedTask }, 200);

    } catch (error) {
        console.error("🚨 Error DELETE /api/tasks:", error);
        return c.json(
            { 
                success: false, 
                message: "Gagal delete task",
                error: error instanceof Error ? error.message : "Unknown error" 
            },
            500
        );
    }
});

const generateToken = (
	payload: object,
	options?: jwt.SignOptions & { expiresIn?: string | number },
) => {
	if (!process.env.JWT_SECRET) {
		throw new Error("JWT_SECRET environment variable is not defined");
	}

	return jwt.sign(payload, process.env.JWT_SECRET, {
		...options,
		expiresIn: options?.expiresIn || "1h", // Default 1 jam
	});
};

App.post("/register", async (c) => {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
        return c.json(
            {
                success: false,
                message: "Email dan password wajib diisi",
            },
            400,
        );
    }

    try {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return c.json(
                {
                    success: false,
                    message: "Format email tidak valid",
                },
                400,
            );
        }

        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()));

        if (existingUser.length > 0) {
            return c.json(
                {
                    success: false,
                    message: "Email sudah terdaftar",
                },
                400,
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [newUser] = await db
            .insert(users)
            .values({
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
            })
            .returning();

        // HAPUS GENERATE TOKEN DI REGISTER
        return c.json(
            {
                success: true,
                data: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name
                },
            },
            201,
        );

    } catch (error) {
        console.error("🚨 Error registrasi:", error);
        return c.json(
            {
                success: false,
                message: "Gagal melakukan registrasi",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            500,
        );
    }
});

App.post("/login", async (c) => {
	const { email, password } = await c.req.json();

	try {
		if (!email || !password) {
			return c.json(
				{ success: false, message: "Email dan password wajib diisi" },
				400,
			);
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email.toLowerCase()));

		if (!user) {
			await bcrypt.compare(
				password,
				"$2b$12$fakehashforpreventingtimingattack",
			);
			return c.json(
				{ success: false, message: "Email atau password salah" },
				401,
			);
		}

		const isValidPassword = await bcrypt.compare(password, user.password);

		if (!isValidPassword) {
			return c.json(
				{ success: false, message: "Email atau password salah" },
				401,
			);
		}

		const accessToken = generateToken(
			{ sub: user.id, email: user.email },
			{ expiresIn: "15m" },
		);

		const refreshToken = generateToken({ sub: user.id }, { expiresIn: "7d" });

		return c.json({
			success: true,
			data: {
				id: user.id,
				email: user.email,
				name: user.name,
				token: {
					access_token: accessToken,
					refresh_token: refreshToken,
					token_type: "Bearer",
					expires_in: 900,
				},
			},
		});
	} catch (error) {
		console.error("🚨 Error login:", error);
		return c.json(
			{
				success: false,
				message: "Gagal melakukan login",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

export default handle(App);
