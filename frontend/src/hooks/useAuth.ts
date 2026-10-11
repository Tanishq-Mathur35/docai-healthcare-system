import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService, LoginPayload, RegisterPayload } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../store/notificationStore';
import { queryClient } from '../lib/queryClient';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: LoginPayload) => authService.login(data),
    onSuccess: (res) => {
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      success('Welcome back!', `Hello, ${user.firstName}`);
      const redirectMap: Record<string, string> = {
        PATIENT: '/patient/dashboard',
        DOCTOR: '/doctor/dashboard',
        ADMIN: '/admin/dashboard',
      };
      navigate(redirectMap[user.role] || '/');
    },
    onError: (err: any) => {
      error('Login failed', err.response?.data?.message || 'Invalid credentials');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: RegisterPayload) => authService.register(data),
    onSuccess: () => {
      success('Account created!', 'Please check your email to verify your account.');
      navigate('/login');
    },
    onError: (err: any) => {
      error('Registration failed', err.response?.data?.message || 'Something went wrong');
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { success } = useToast();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      success('Logged out', 'See you next time!');
      navigate('/login');
    },
  });
}
