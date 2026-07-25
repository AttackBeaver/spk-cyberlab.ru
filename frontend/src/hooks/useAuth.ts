import { useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  username?: string;
  email?: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  groupId?: number;
  studentNumber?: number;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

interface RegisterStudentData {
  groupId: number;
  studentNumber: number;
  password: string;
  fullName: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          if (isMounted) setUser(response.data);
        } catch {
          if (isMounted) localStorage.removeItem('token');
        }
      }
      if (isMounted) setLoading(false);
    };

    loadUser();
    return () => { isMounted = false; };
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  };

  const registerStudent = async (data: RegisterStudentData) => {
    const res = await api.post('/auth/register-student', data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, loading, login, register, registerStudent, logout };
};