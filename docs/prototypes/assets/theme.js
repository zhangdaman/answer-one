// 首答 AnswerOne — Tailwind 主题（全页面唯一来源）
// 在每个页面 <head> 中于 cdn.tailwindcss.com 之后加载。
// 方向：守住 B1 定稿品牌蓝 #2563EB，但保留渐变/玻璃/色块/柔和圆角的「有活力」表达。
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', strong: '#1D4ED8', soft: '#EFF4FF' },
        accent: '#0EA5E9',
        offblack: '#18181B',
        secondary: '#5B5B6B',
        muted: '#9A9AAB',
        canvas: '#F6F7FB',
        surface: '#FFFFFF',
        line: '#E9E9F0',
        hairline: '#F1F1F6',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        display: ['Outfit', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      letterSpacing: { tighter: '-0.04em', tightish: '-0.02em' },
      // 圆角放松到更现代/友好的档位（B1 原为 8px 克制，本次为提升观感放宽）
      borderRadius: { md: '10px', lg: '14px', xl: '18px', '2xl': '22px' },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 6px 20px -10px rgba(15,23,42,0.12)',
        elevated: '0 10px 36px -12px rgba(15,23,42,0.20)',
        brand: '0 12px 30px -10px rgba(37,99,235,0.55)',
        hero: '0 26px 64px -22px rgba(37,99,235,0.60)',
        ring: '0 0 0 3px rgba(37,99,235,0.18)',
      },
      backgroundImage: {
        // 品牌蓝渐变：深蓝 → 品牌蓝 → 青，保持活力但不偏紫
        'brand-gradient': 'linear-gradient(135deg,#1D4ED8 0%,#2563EB 48%,#0EA5E9 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(14,165,233,0.08))',
        // 英雄渐变（自带实心蓝底，最后一层）：白高光推到右上、青辉光在右、深蓝压到左下，
        // 保证左侧文字区始终是深蓝底 → 白字对比度达标。两类同写 background-image 时本 token 已含底色，故可独立使用。
        'hero-mesh': 'radial-gradient(58% 110% at 88% 2%, rgba(255,255,255,0.18), rgba(255,255,255,0) 56%), radial-gradient(60% 125% at 106% 24%, rgba(56,189,248,0.50), rgba(56,189,248,0) 60%), radial-gradient(95% 150% at 4% 120%, rgba(23,55,165,0.65), rgba(23,55,165,0) 62%), linear-gradient(125deg,#1B47C9 0%,#2563EB 52%,#0EA5E9 116%)',
        'page-wash': 'linear-gradient(180deg,#EFF4FF 0%, #F6F7FB 20%)',
        'card-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0) 42%)',
      },
    },
  },
};
