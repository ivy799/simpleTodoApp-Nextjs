"use client";

import { redirect } from 'next/navigation';

interface Task {
	id: string;
	title: string;
	description: string;
	created_at: string;
}

export default function HomePage() {
	redirect('/login');
}
