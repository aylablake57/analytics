'use client';

import { useEffect, useState } from 'react';
import { postService } from '@/lib/services/postService';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

/* interface Post {
	id: number;
	title: string;
	content: string;
	user_id: number;
} */

interface Post {
	id: number;
	title: string;
	content: string;
	user_id: number;
	created_at: string;
	updated_at: string;
	user?: {
		id: number;
		name: string;
		email: string;
	};
}

export default function PostsPage() {
	const router = useRouter();
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);

	// Only render on client
	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;

		const fetchPosts = async () => {
			try {
				setLoading(true);
				setError(null);
		
				const response = await postService.getAllPosts();
		
				// DEBUG: Log the response structure
				console.log('Full response:', response);
				console.log('Response type:', typeof response);
				console.log('Is array?', Array.isArray(response));
		
				if (Array.isArray(response)) {
					setPosts(response);
				} else {
					console.error('Unexpected response structure:', response);
					setPosts([]);
					setError('Unable to load posts. Unexpected response format.');
				}
			} catch (err: any) {
				console.error('Error:', err);
				setError(
					err.response?.data?.message ||
					err.message ||
					'Failed to load posts'
				);
				setPosts([]);
			} finally {
				setLoading(false);
			}
		};

		fetchPosts();
	}, [mounted]);

	// Don't render anything until mounted on client
	if (!mounted) {
		return null;
	}

	/* const fetchPosts = async () => {
		try {
			setLoading(true);
			const data = await postService.getAllPosts();
			setPosts(data);
		} catch (err) {
			setError('Failed to fetch posts');
			console.error(err);
		} finally {
			setLoading(false);
		}
	}; */

	/* if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>; */

	return (
		<ProtectedRoute>
			{/* <Navbar /> */}
			<div className="min-h-screen bg-gradient-to-br bg-danger from-slate-900 via-purple-900 to-slate-900 pt-24 px-4">
				<div className="max-w-6xl mx-auto">
					{/* Header */}
					<div className="mb-8 flex justify-between items-center flex-col sm:flex-row gap-4">
						<div>
							<h1 className="text-4xl font-bold text-white mb-2">Posts 100</h1>
							<p className="text-gray-400">
								{posts.length} {posts.length === 1 ? 'post' : 'posts'} total
							</p>
						</div>
						<Link href="/posts/create" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/50 whitespace-nowrap">
							Create New Post
						</Link>
					</div>

					{/* Loading State */}
					{loading && (
						<div className="flex justify-center items-center py-12">
							<div className="animate-pulse text-center">
								<div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
								<p className="text-gray-400">Loading posts...</p>
							</div>
						</div>
					)}

					{/* Error State */}
					{error && !loading && (
						<div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
							<p className="text-red-400">{error}</p>
						</div>
					)}

					{/* Empty State */}
					{!loading && posts.length === 0 && !error && (
						<div className="text-center py-12">
							<p className="text-gray-400 text-lg mb-4">No posts yet.</p>
							<Link
								href="/posts/create"
								className="text-purple-400 hover:text-purple-300 underline"
							>
								Create your first post
							</Link>
						</div>
					)}

					{/* Posts Grid */}
					{!loading && posts.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{posts.map((post) => (
								<PostCard key={post.id} post={post} />
							))}
						</div>
					)}
				</div>
			</div>
		</ProtectedRoute>
	);
}

// Separate component for post card to handle date formatting safely
interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
	const [formattedDate, setFormattedDate] = useState<string>('');

  	// Format date on client only
	useEffect(() => {
		const date = new Date(post.created_at);
		setFormattedDate(date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}));
	}, [post.created_at]);

  return (
	<div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg overflow-hidden hover:border-purple-400/60 transition duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20 group">
		{/* Post Header */}
		<div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
			<h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition mb-2 line-clamp-2">
				{post.title}
			</h2>
			<p className="text-sm text-gray-400">
				By {post.user?.name || 'Unknown'} • {formattedDate}
			</p>
		</div>

		{/* Post Content */}
		<div className="p-6">
			<p className="text-gray-300 line-clamp-4 mb-4">{post.content}</p>
		</div>

		{/* Post Footer */}
		<div className="px-6 py-4 border-t border-purple-500/20 flex gap-3">
			<Link href={`/posts/${post.id}`} className="flex-1 text-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
				View
			</Link>
			<Link href={`/posts/${post.id}/edit`} className="flex-1 text-center bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition duration-300">
				Edit
			</Link>
		</div>
	</div>
  );
}