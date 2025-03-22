'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  onSuccess: () => void;
}

interface Task {
  id: string;
  title: string;
  description: string;
}

export default function TaskForm({ open, onClose, task, onSuccess }: TaskFormProps) {
  useEffect(() => {
    if (!open) {
      (document.getElementById('task-form') as HTMLFormElement)?.reset();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const file = formData.get('attachment') as File;

    try {
      const data = new FormData();
      data.append('title', formData.get('title') as string);
      data.append('description', formData.get('description') as string);
      if (file.size > 0) data.append('attachment', file);

      const url = task?.id ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: data,
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.message || 'Gagal memproses permintaan');
      }

      onSuccess();
      onClose();
      toast.success(`Task berhasil di${task?.id ? 'perbarui' : 'buat'}`);
    } catch (error) {
      console.error('Operation failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga',
        { duration: 5000 }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task?.id ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input 
              name="title" 
              defaultValue={task?.title} 
              required 
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              name="description"
              defaultValue={task?.description}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="attachment">Attachment</Label>
            <Input 
              name="attachment" 
              type="file" 
              className="mt-1"
              accept=".pdf,.doc,.docx,image/*"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {task?.id ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}