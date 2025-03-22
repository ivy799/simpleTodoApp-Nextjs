"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useCallback  } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import TaskForm from "@/components/TaskForm";
import { toast, Toaster } from "sonner";

interface Task {
	id: string;
	title: string;
	description: string;
	created_at: string;
}

export default function HomePage() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);

	// Gunakan useCallback untuk memoize fungsi fetchTasks
	const fetchTasks = useCallback(async () => {
		try {
			const res = await fetch("/api/tasks", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
			});

			if (!res.ok) throw new Error("Failed to fetch");

			const data = await res.json();
			setTasks(data.data);
		} catch (error) {
			console.error("Failed to fetch tasks:", error);
			toast.error("Gagal memuat tasks");
		}
	}, []); // Tambahkan dependencies jika diperlukan

	useEffect(() => {
		fetchTasks();
	}, [fetchTasks]);

	const handleDelete = async (taskId: string) => {
		try {
			const res = await fetch(`/api/tasks/${taskId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
			});

			if (res.ok) {
				setTasks(tasks.filter((t) => t.id !== taskId));
				toast.success("Task berhasil dihapus");
			}
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("Gagal menghapus task");
		}
	};

	return (
		<ProtectedRoute>
			<div className="container mx-auto p-4">
				<Toaster position="top-center" />
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-2xl font-bold">My Tasks</h1>
					<Button
						onClick={() => {
							setSelectedTask(null);
							setShowForm(true);
						}}
					>
						Add Task
					</Button>
				</div>

				<div className="grid gap-4">
					{tasks.map((task) => (
						<Card key={task.id}>
							<CardHeader>
								<CardTitle>{task.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p>{task.description}</p>
								<div className="mt-4 space-x-2">
									<Button
										variant="outline"
										onClick={() => {
											setSelectedTask(task);
											setShowForm(true);
										}}
									>
										Edit
									</Button>
									<Button
										variant="destructive"
										onClick={() => handleDelete(task.id)}
									>
										Delete
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				<TaskForm
					open={showForm}
					onClose={() => setShowForm(false)}
					task={selectedTask}
					onSuccess={fetchTasks}
				/>
			</div>
		</ProtectedRoute>
	);
}
