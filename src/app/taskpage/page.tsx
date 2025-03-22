"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Bar,
	BarChart,
	XAxis,
	YAxis,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
	CalendarIcon,
	ListTodo,
	PlusCircle,
	Paperclip,
	MoreVertical,
	Pencil,
	Trash2,
	TriangleAlert,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import TaskForm from "@/components/TaskForm";
import { toast, Toaster } from "sonner";

interface Task {
	id: string;
	title: string;
	description: string;
	created_at: string;
	attachments?: {
		id: string;
		fileName: string;
		fileUrl: string;
		fileType: string;
	}[];
}

export default function HomePage() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [date, setDate] = useState<Date | undefined>(new Date());
	const [monthlyData, setMonthlyData] = useState<
		{ name: string; tasks: number }[]
	>([]);
	const [loading, setLoading] = useState(true);

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

			// Process data for chart
			processChartData(data.data);
		} catch (error) {
			console.error("Failed to fetch tasks:", error);
			toast.error("Gagal memuat tasks");
		} finally {
			setLoading(false);
		}
	}, []);

	const processChartData = (taskData: Task[]) => {
		const monthCounts: Record<string, number> = {};

		for (const task of taskData) {
			const date = new Date(task.created_at);
			const monthYear = format(date, "MMM yyyy");

			if (monthCounts[monthYear]) {
				monthCounts[monthYear]++;
			} else {
				monthCounts[monthYear] = 1;
			}
		}

		const chartData = Object.keys(monthCounts).map((month) => ({
			name: month,
			tasks: monthCounts[month],
		}));

		setMonthlyData(chartData);
	};

	useEffect(() => {
		fetchTasks();

		const storedMonthlyData = localStorage.getItem("monthlyData");
		if (
			monthlyData.length === 0 &&
			(!storedMonthlyData || storedMonthlyData === "undefined")
		) {
			const sampleData = [
				{ name: "Jan 2025", tasks: 4 },
				{ name: "Feb 2025", tasks: 3 },
				{ name: "Mar 2025", tasks: 6 },
			];
			setMonthlyData(sampleData);
		}
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
				fetchTasks();
			}
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("Gagal menghapus task");
		}
	};

	const getTasksForDate = (date: Date | undefined) => {
		if (!date) return [];

		return tasks.filter((task) => {
			const taskDate = new Date(task.created_at);
			return (
				taskDate.getDate() === date.getDate() &&
				taskDate.getMonth() === date.getMonth() &&
				taskDate.getFullYear() === date.getFullYear()
			);
		});
	};

	const chartConfig = {
		tasks: {
			label: "Tasks",
			color: "hsl(var(--primary))",
		},
	};

	return (
		<ProtectedRoute>
			<div className="container mx-auto p-4 pt-6">
				<Toaster position="top-center" />
				<div className="flex justify-between items-center mb-6">
					<Button
						onClick={() => {
							setSelectedTask(null);
							setShowForm(true);
						}}
					>
						<PlusCircle className="mr-2 h-4 w-4" /> Add Task
					</Button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
					{/* Section 1: Task List */}
					<Card className="h-full flex flex-col">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center">
								<ListTodo className="mr-2 h-5 w-5" /> Task List
							</CardTitle>
						</CardHeader>
						<CardContent className="overflow-y-auto max-h-[600px]">
							{loading ? (
								<div className="space-y-4">
									{[...Array(3)].map(() => (
										<Card key={crypto.randomUUID()} className="animate-pulse">
											<div className="h-24 bg-muted/50 rounded-lg" />
										</Card>
									))}
								</div>
							) : tasks.length === 0 ? (
								<p className="text-muted-foreground text-center py-4">
									No tasks found
								</p>
							) : (
								<div className="space-y-4">
									{tasks.map((task) => (
										<Card key={task.id} className="mb-2">
											<CardHeader className="py-3 space-y-0">
												<div className="flex justify-between items-center">
													<div>
														<CardTitle className="text-base font-medium">
															{task.title}
														</CardTitle>
														<p className="text-xs text-muted-foreground">
															{format(new Date(task.created_at), "dd MMM yyyy")}
														</p>
													</div>

													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="sm"
																className="h-8 w-8 p-0"
															>
																<MoreVertical className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>

														<DropdownMenuContent align="end" className="w-64">
															<div className="p-2 space-y-3">
																{/* Deskripsi */}
																{task.description && (
																	<p className="text-sm text-muted-foreground">
																		{task.description}
																	</p>
																)}

																{/* Attachments */}
																{task.attachments?.map((attachment) => (
																	<a
																		key={attachment.id}
																		href={attachment.fileUrl}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="flex items-center text-sm text-blue-600 hover:underline"
																	>
																		<Paperclip className="mr-2 h-4 w-4" />
																		{attachment.fileName}
																	</a>
																))}

																{/* Action Buttons */}
																<div className="flex flex-col space-y-2">
																	<Button
																		variant="outline"
																		size="sm"
																		className="w-full"
																		onClick={() => {
																			setSelectedTask(task);
																			setShowForm(true);
																		}}
																	>
																		<Pencil className="mr-2 h-4 w-4" />
																		Edit
																	</Button>
																	<Button
																		variant="destructive"
																		size="sm"
																		className="w-full"
																		onClick={() => handleDelete(task.id)}
																	>
																		<Trash2 className="mr-2 h-4 w-4" />
																		Delete
																	</Button>
																</div>
															</div>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</CardHeader>
										</Card>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<div className="grid grid-rows-2 gap-6 h-full">
						{/* Section 2: Chart */}
						<Card className="h-full flex flex-col">
							<CardHeader>
								<CardTitle>Tasks Added Per Month</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="h-[250px] w-full">
									{loading ? (
										<div className="flex items-center justify-center h-full">
											<div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
										</div>
									) : monthlyData.length > 0 ? (
										<ResponsiveContainer width="100%" height="100%">
											<BarChart
												data={monthlyData}
												margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
											>
												<XAxis
													dataKey="name"
													tickLine={false}
													axisLine={false}
													fontSize={12}
												/>
												<YAxis
													tickLine={false}
													axisLine={false}
													fontSize={12}
													width={30}
												/>
												<Tooltip />
												<Bar
													dataKey="tasks"
													fill="hsl(var(--primary))"
													radius={[4, 4, 0, 0]}
													maxBarSize={50}
												/>
											</BarChart>
										</ResponsiveContainer>
									) : (
										<p className="text-muted-foreground text-center py-4">
											No data available
										</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Section 3: Calendar & Development Notice */}
						<div className="h-full flex flex-col md:flex-row gap-6">
							{/* Calendar Section */}
							<Card className="flex-1">
								<CardHeader>
									<CardTitle className="flex items-center">
										<CalendarIcon className="mr-2 h-5 w-5" /> Task Calendar
									</CardTitle>
								</CardHeader>
								<CardContent>
									<Tabs defaultValue="calendar">
										<TabsList className="mb-4">
											<TabsTrigger value="calendar">Calendar</TabsTrigger>
											<TabsTrigger value="tasks">Tasks for Date</TabsTrigger>
										</TabsList>
										<TabsContent value="calendar" className="space-y-4">
											<Calendar
												mode="single"
												selected={date}
												onSelect={setDate}
												className="rounded-md border mx-auto"
											/>
										</TabsContent>
										<TabsContent value="tasks" className="space-y-4">
											<div className="text-sm text-muted-foreground mb-2">
												{date ? format(date, "MMMM d, yyyy") : "Select a date"}
											</div>
											<div className="space-y-3">
												{getTasksForDate(date).length > 0 ? (
													getTasksForDate(date).map((task) => (
														<Card key={task.id}>
															<CardHeader className="py-3">
																<CardTitle className="text-base">
																	{task.title}
																</CardTitle>
															</CardHeader>
															<CardContent className="py-2">
																<p className="text-sm">{task.description}</p>
															</CardContent>
														</Card>
													))
												) : (
													<p className="text-muted-foreground text-center py-4">
														No tasks for this date
													</p>
												)}
											</div>
										</TabsContent>
									</Tabs>
								</CardContent>
							</Card>

							{/* Development Notice Section */}
							<Card className="border-yellow-500/20 bg-yellow-500/10 flex-1">
								<CardHeader className="py-3">
									<div className="flex items-center gap-2">
										<TriangleAlert className="h-5 w-5 text-yellow-500" />
										<CardTitle className="text-yellow-500">
											Development Notice
										</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-yellow-500/80">
										This application is currently in active development.
										Features may change without prior notice. Thank you for your
										understanding.
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
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
