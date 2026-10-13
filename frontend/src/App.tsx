import { useEffect } from 'react';
import AppRoutes from './routes';
import { Toaster } from './components/ui/toaster';
import { useThemeStore } from './store/themeStore';

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}
