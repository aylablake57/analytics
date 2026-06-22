import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Important for cookies
});

// Add token to every request
API.interceptors.request.use((config) => {
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('auth_token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
	}
	return config;
});

// Handle response and token expiration
API.interceptors.response.use(
	(response) => response,
  	(error) => {
    	// If 401, token might be expired
		if (error.response?.status === 401) {
			localStorage.removeItem('auth_token');
			localStorage.removeItem('user');
			
			// Redirect to login only if not already there
			if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
				window.location.href = '/auth/login';
			}
		}

		// Log detailed error info
		console.error('API Error:', {
			status: error.response?.status,
			message: error.response?.data?.message,
			data: error.response?.data,
		});
    	return Promise.reject(error);
  	}
);

export default API;
