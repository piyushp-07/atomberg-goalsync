export const getRoleTheme = (role, isDark = false) => {
  if (isDark) {
    return {
      primary: 'yellow',
      text: 'text-amber-400',
      bg: 'bg-amber-500',
      bgHover: 'hover:bg-amber-600',
      bgLight: 'bg-amber-500/10',
      border: 'border-zinc-800',
      gradient: 'from-amber-400 to-yellow-500',
      shadow: 'shadow-amber-500/20',
      hoverBg: 'hover:bg-amber-500/10 hover:text-amber-400',
      chartColor: '#f59e0b',
      pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      accentBg: 'bg-amber-500/10',
      accentText: 'text-amber-400',
      cardBg: 'bg-zinc-900 border border-zinc-800 text-zinc-100',
      textMuted: 'text-zinc-400',
      bodyBg: 'bg-zinc-950 text-zinc-100'
    };
  } else {
    return {
      primary: 'yellow',
      text: 'text-amber-600',
      bg: 'bg-amber-500',
      bgHover: 'hover:bg-amber-600',
      bgLight: 'bg-amber-50',
      border: 'border-zinc-300',
      gradient: 'from-amber-500 to-yellow-400',
      shadow: 'shadow-amber-500/10',
      hoverBg: 'hover:bg-amber-500/10 hover:text-amber-600',
      chartColor: '#f59e0b',
      pill: 'bg-amber-50 text-amber-800 border border-amber-250',
      accentBg: 'bg-amber-100',
      accentText: 'text-amber-800',
      cardBg: 'bg-white border border-zinc-300 text-zinc-800',
      textMuted: 'text-zinc-500',
      bodyBg: 'bg-zinc-100/70 text-zinc-800'
    };
  }
};
