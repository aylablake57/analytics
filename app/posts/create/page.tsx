'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postService } from '@/lib/services/postService';

export default function CreatePost() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        user_id: 1,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');
            await postService.createPost({
                title: formData.title,
                content: formData.content,
            });
            router.push('/posts');
        } catch (error) {
            console.error('Full error:', error); // Log full error for debugging
      
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-3xl font-bold mb-6">Create Post</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label className="block text-sm font-medium">Title</label>
            <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
            />
            </div>
            <div>
            <label className="block text-sm font-medium">Content</label>
            <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
                rows={5}
            />
            </div>
            <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
            {loading ? 'Creating...' : 'Create Post'}
            </button>
        </form>
        </div>
    );
}
