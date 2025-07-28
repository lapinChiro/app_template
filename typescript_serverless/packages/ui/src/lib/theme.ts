export const themes = {
  member: {
    primary: '217 91% 60%',
    secondary: '217 19% 27%',
    accent: '215 20.2% 65.1%',
  },
  admin: {
    primary: '263 70% 50%',
    secondary: '263 20% 30%',
    accent: '263 20% 60%',
  },
} as const;

export type Theme = keyof typeof themes;

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const colors = themes[theme];
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}