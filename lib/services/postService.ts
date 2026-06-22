import API from '@/lib/api';

export const postService = {
    // Get all posts
    getAllPosts: async () => {
        try {
            const response = await API.get('/posts');
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Get single post
    getPost: async (id: number) => {
        try {
            const response = await API.get(`/posts/${id}`);
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Create post
    createPost: async (data: { title: string; content: string; /* user_id: number */ }) => {
        try {
            const response = await API.post('/posts', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update post
    updatePost: async (id: number, data: { title: string; content: string }) => {
        try {
            const response = await API.put(`/posts/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete post
    deletePost: async (id: number) => {
        try {
            await API.delete(`/posts/${id}`);
        } catch (error) {
            throw error;
        }
    },
};
