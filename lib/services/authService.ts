import API from '@/lib/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
  password_confirmation: string;
}

interface AuthResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  token: string;
}

const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await API.post<AuthResponse>('/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await API.post<AuthResponse>('/login', credentials);

      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await API.post('/logout');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    } catch (error) {
      // Clear local storage even if logout request fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await API.get('/user');
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },

  getStoredUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  },

  refreshToken: async () => {
    try {
      const response = await API.post('/refresh');
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data.token;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
