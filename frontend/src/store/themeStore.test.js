import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './themeStore';

describe('themeStore.js', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.getState().setTheme('light');
  });

  it('initializes with default light theme', () => {
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles from light to dark theme', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('sms-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles from dark back to light theme', () => {
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('sms-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('sets theme directly with setTheme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('sms-theme')).toBe('dark');
  });
});
