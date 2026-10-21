import { create } from 'zustand';

const initialTheme = localStorage.getItem('sms-theme') || 'light';
document.documentElement.setAttribute('data-theme', initialTheme);

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('sms-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    return { theme: nextTheme };
  }),
  setTheme: (newTheme) => {
    localStorage.setItem('sms-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    set({ theme: newTheme });
  }
}));
