// 首答 AnswerOne — 原型共享外壳（固定侧边栏注入）
// 仅供内页（工作台/品牌档案/诊断/内容库/分发）调用：mountShell('home')
(function () {
  // 工作台首页（总览，置顶，不编号）
  const NAV_OVERVIEW = { key: 'home', label: '工作台首页', href: '03-工作台首页.html' };

  // 主流程：①→⑤ 一条龙。侧栏「主流程」分组与顶部进度条共用这份顺序。
  const FLOW = [
    { key: 'brand', label: '品牌档案', href: '04-品牌档案.html' },
    { key: 'diag', label: '内容诊断', href: '05-诊断列表.html' },
    { key: 'gen', label: '内容生成', href: '07-内容生成.html' },
    { key: 'content', label: '内容库', href: '08-内容库.html' },
    { key: 'dist', label: '分发计划', href: '09-分发建议.html' },
  ];

  // 顶部进度条「下一步」目标（含「开始诊断」与「末步复诊」的语义）
  const RAIL_NEXT = [
    { label: '内容诊断', href: '05-诊断列表.html?new=1' },
    { label: '内容生成', href: '07-内容生成.html' },
    { label: '内容库', href: '08-内容库.html' },
    { label: '分发计划', href: '09-分发建议.html' },
    { label: '复诊 · 重新诊断', href: '05-诊断列表.html?new=1', loop: true },
  ];

  const ICONS = {
    home: '<path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/>',
    help: '<circle cx="12" cy="12" r="8.2"/><path d="M9.6 9.6a2.4 2.4 0 1 1 3.1 2.3c-.7.3-1.2.9-1.2 1.6M12 16.6h.01"/>',
  };

  // 演示版「旅程状态」：首页据此推荐唯一下一步（静态原型，写死一种典型态）
  window.AO_STATE = {
    hasBrand: true,
    diagnosed: true,
    score: 64,
    gaps: 6,
    hasContent: true,
    distributed: false,
  };

  function navItem(item, active) {
    const isActive = item.key === active;
    const base =
      'group relative flex items-center gap-3 pl-4 pr-3 h-10 rounded-lg text-[13.5px] transition-colors outline-none ' +
      'focus-visible:ring-2 focus-visible:ring-primary/40';
    const state = isActive
      ? 'bg-brand-gradient text-white font-semibold shadow-brand'
      : 'text-secondary hover:bg-primary/[0.06] hover:text-primary active:bg-primary/10';
    return (
      `<a href="${item.href}" aria-current="${isActive ? 'page' : 'false'}" class="${base} ${state}">` +
      `<svg viewBox="0 0 24 24" class="w-[18px] h-[18px] shrink-0 ${isActive ? 'opacity-100' : 'opacity-70'}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[item.key]}</svg>` +
      `<span>${item.label}</span></a>`
    );
  }

  // 主流程步骤项：用编号徽标代替图标，凸显「这是一条有序流程」
  function flowItem(item, idx, active) {
    const isActive = item.key === active;
    const base =
      'group relative flex items-center gap-3 pl-3 pr-3 h-10 rounded-lg text-[13.5px] transition-colors outline-none ' +
      'focus-visible:ring-2 focus-visible:ring-primary/40';
    const state = isActive
      ? 'bg-brand-gradient text-white font-semibold shadow-brand'
      : 'text-secondary hover:bg-primary/[0.06] hover:text-primary active:bg-primary/10';
    // 徽标底色用内联样式：避开 Play CDN 对「仅 JS 注入的动态 bg-」不生成的坑
    const badge = isActive
      ? 'background:rgba(255,255,255,.22);color:#fff'
      : 'background:#EFF4FF;color:#2563EB';
    return (
      `<a href="${item.href}" aria-current="${isActive ? 'page' : 'false'}" class="${base} ${state}">` +
      `<span class="w-[22px] h-[22px] shrink-0 grid place-items-center rounded-full text-[12px] font-bold tabular-nums" style="${badge}">${idx}</span>` +
      `<span>${item.label}</span></a>`
    );
  }

  // ——— 多品牌：当前账号名下的品牌（演示数据；当前品牌由 curBrand 指向）———
  const BRANDS = [
    { name: '茶语时光', meta: '茶饮咖啡 · 杭州' },
    { name: '茶语·滨江店', meta: '茶饮咖啡 · 杭州' },
  ];
  let curBrand = 0;
  window.AO_BRANDS = {
    list: BRANDS,
    get current() { return curBrand; },
    set current(i) { curBrand = i; },
  };

  function brandRow(b, i) {
    const on = i === curBrand;
    return (
      `<button data-brand="${i}" class="ao-brand-row w-full flex items-center gap-2.5 px-2.5 h-11 rounded-lg text-left transition-colors ${on ? 'bg-primary/5' : 'hover:bg-primary/[0.05]'}">` +
      `<span class="min-w-0 flex-1"><span class="block text-[13px] font-medium text-offblack truncate">${b.name}</span><span class="block text-[11px] text-muted truncate">${b.meta}</span></span>` +
      `<svg viewBox="0 0 24 24" class="ao-brand-check w-4 h-4 text-primary shrink-0 ${on ? '' : 'hidden'}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 6"/></svg>` +
      `</button>`
    );
  }

  function brandSwitcherHTML() {
    const c = BRANDS[curBrand];
    return `
  <div class="px-3 pt-3 pb-1 relative">
    <button id="ao-brand-switch" class="w-full flex items-center gap-2.5 px-3 h-12 rounded-xl border border-line bg-surface hover:bg-primary/[0.04] hover:border-primary/30 transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
      <span class="min-w-0 flex-1">
        <span id="ao-brand-name" class="block text-[13px] font-semibold text-offblack truncate">${c.name}</span>
        <span id="ao-brand-meta" class="block text-[11px] text-muted truncate">${c.meta}</span>
      </span>
      <svg id="ao-brand-caret" viewBox="0 0 24 24" class="w-4 h-4 text-muted shrink-0 transition-transform" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div id="ao-brand-menu" class="hidden absolute left-3 right-3 top-[62px] z-30 rounded-xl border border-line bg-surface shadow-elevated p-1.5">
      <div class="px-2 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-muted">切换品牌 · ${BRANDS.length} 个</div>
      <div id="ao-brand-list" class="space-y-0.5">${BRANDS.map(brandRow).join('')}</div>
      <div class="my-1.5 border-t border-hairline"></div>
      <a href="04-品牌档案.html?newBrand=1" class="flex items-center gap-2 px-2.5 h-9 rounded-lg text-[13px] font-medium text-primary hover:bg-primary/[0.06] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>新建品牌
      </a>
      <a href="04-品牌档案.html" class="flex items-center gap-2 px-2.5 h-9 rounded-lg text-[13px] text-secondary hover:bg-line/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>管理品牌档案
      </a>
    </div>
  </div>`;
  }

  // 切换当前品牌：更新切换器头部 + 列表选中态，并广播 ao:brandchange（供品牌档案页联动）
  function applyBrand(i) {
    if (i === curBrand || !BRANDS[i]) return;
    curBrand = i;
    const b = BRANDS[i];
    const n = document.getElementById('ao-brand-name');
    const m = document.getElementById('ao-brand-meta');
    if (n) n.textContent = b.name;
    if (m) m.textContent = b.meta;
    document.querySelectorAll('#ao-brand-list .ao-brand-row').forEach((el) => {
      const on = +el.getAttribute('data-brand') === curBrand;
      el.classList.toggle('bg-primary/5', on);
      el.classList.toggle('hover:bg-primary/[0.05]', !on);
      const ck = el.querySelector('.ao-brand-check');
      if (ck) ck.classList.toggle('hidden', !on);
    });
    document.dispatchEvent(new CustomEvent('ao:brandchange', { detail: { index: i, brand: b } }));
  }

  function sidebarHTML(active) {
    return `
<aside class="fixed inset-y-0 left-0 w-60 bg-surface border-r border-line flex flex-col z-20">
  <div class="h-16 flex items-center gap-2.5 px-5 border-b border-hairline">
    <div class="w-9 h-9 rounded-xl bg-brand-gradient text-white grid place-items-center font-display font-extrabold tracking-tighter text-lg shadow-brand">答</div>
    <div class="leading-tight">
      <div class="font-display font-bold text-offblack tracking-tighter text-[15px]">首答</div>
      <div class="text-[10.5px] text-muted tracking-[0.18em] font-medium uppercase">AnswerOne</div>
    </div>
  </div>
  ${brandSwitcherHTML()}
  <nav class="flex-1 px-3 py-4 overflow-y-auto">
    <div class="space-y-0.5">
      ${navItem(NAV_OVERVIEW, active)}
    </div>
    <div class="px-4 mt-5 mb-2 flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.16em] uppercase text-muted">
      <span>主流程</span><span class="h-px flex-1 bg-hairline"></span>
    </div>
    <div class="space-y-0.5">
      ${FLOW.map((it, i) => flowItem(it, i + 1, active)).join('')}
    </div>
    <div class="px-4 mt-6 mb-2 text-[10.5px] font-semibold tracking-[0.16em] uppercase text-muted">工具</div>
    <a href="#" class="group flex items-center gap-3 pl-4 pr-3 h-10 rounded-lg text-[13.5px] text-secondary hover:bg-line/50 hover:text-offblack transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
      <svg viewBox="0 0 24 24" class="w-[18px] h-[18px] shrink-0 opacity-80" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS.help}</svg>
      <span>帮助 · 课程入口</span>
      <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 ml-auto opacity-50" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M9 7h8v8"/></svg>
    </a>
  </nav>
  <div class="p-3 border-t border-hairline">
    <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-line/40 transition-colors">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-offblack to-zinc-700 text-white grid place-items-center text-sm font-semibold ring-1 ring-black/5">茶</div>
      <div class="min-w-0 flex-1">
        <div class="text-[13px] font-semibold text-offblack truncate">茶语时光</div>
        <div class="text-[11px] text-muted truncate">学员 · 第一期</div>
      </div>
      <a href="01-登录页.html" title="退出登录" class="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger active:bg-danger/15 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-danger/30">
        <svg viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12H6m0 0 3-3m-3 3 3 3M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4"/></svg>
      </a>
    </div>
  </div>
</aside>`;
  }

  // ——— 顶部「主流程进度条」：把分散的页面串成一条带前进/后退的旅程 ———
  // 页面只需在内容顶部放 <div id="ao-flow-rail"></div>，mountShell 会按当前步骤填充。
  function railHTML(active) {
    const idx = FLOW.findIndex((f) => f.key === active); // 0-based；总览页 = -1
    if (idx < 0) return '';
    const total = FLOW.length;
    const cur = idx + 1;
    const segs = FLOW.map((_, i) => {
      const fill = i <= idx
        ? 'background:linear-gradient(135deg,#1D4ED8,#2563EB 55%,#0EA5E9)'
        : 'background:#E7EAF3';
      return `<span class="h-1.5 rounded-full" style="width:30px;${fill}"></span>`;
    }).join('');
    const prev = idx > 0 ? FLOW[idx - 1] : null;
    const next = RAIL_NEXT[idx];
    const prevBtn = prev
      ? `<a href="${prev.href}" class="hidden sm:inline-flex items-center gap-1 h-9 px-3 rounded-lg text-[12.5px] text-secondary hover:text-primary hover:bg-primary/[0.06] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30">` +
        `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>${prev.label}</a>`
      : '';
    const nextIcon = next.loop
      ? '<svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5"/></svg>'
      : '<svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
    return `
  <div class="mx-auto w-full max-w-[1280px] px-8 pt-5">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface px-5 py-3 shadow-card">
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">${segs}</div>
        <div class="mt-1.5 text-[12px] text-secondary">主流程 · 第 <b class="text-primary font-semibold tabular-nums">${cur}</b> / ${total} 步 · <span class="font-medium text-offblack">${FLOW[idx].label}</span></div>
      </div>
      <div class="ml-auto flex items-center gap-1.5">
        ${prevBtn}
        <a href="${next.href}" class="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white shadow-brand outline-none focus-visible:ring-2 focus-visible:ring-primary/40" style="background:#2563EB">${next.loop ? '' : '下一步：'}${next.label}${nextIcon}</a>
      </div>
    </div>
  </div>`;
  }

  window.mountShell = function (activeKey) {
    const root = document.getElementById('sidebar-root');
    if (root) root.innerHTML = sidebarHTML(activeKey);
    const railHost = document.getElementById('ao-flow-rail');
    if (railHost) railHost.innerHTML = railHTML(activeKey);
  };

  // ——— 演示版交互工具：轻量 toast 提示 ———
  const AO = (window.AO = window.AO || {});

  function ensureToastHost() {
    let host = document.getElementById('ao-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'ao-toast-host';
      host.className =
        'fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none';
      document.body.appendChild(host);
    }
    return host;
  }

  AO.toast = function (msg, type) {
    const host = ensureToastHost();
    const el = document.createElement('div');
    el.className =
      `pointer-events-auto max-w-[78vw] px-4 py-2.5 rounded-xl text-[13px] font-medium ` +
      `flex items-center gap-2 ring-1 ring-black/5 backdrop-blur ` +
      `transition-all duration-300 opacity-0 -translate-y-2`;
    // 背景/文字写成内联样式：Play CDN 不会为「仅经 JS 动态注入、静态页从未出现」的 bg- 类
    // 生成规则（bg-offblack/92、bg-amber-500 会算成透明 → 白字看不见），故这里直接写死颜色。
    const tone =
      type === 'success'
        ? 'background:linear-gradient(135deg,#1D4ED8 0%,#2563EB 48%,#0EA5E9 100%);box-shadow:0 12px 30px -10px rgba(37,99,235,.55)'
        : type === 'warn'
        ? 'background:#B45309;box-shadow:0 10px 30px -12px rgba(15,23,42,.35)'
        : 'background:#18181B;box-shadow:0 10px 30px -12px rgba(15,23,42,.45)';
    el.style.cssText = `${tone};color:#fff`;
    const dot =
      type === 'success'
        ? '<svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 6"/></svg>'
        : '<svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0 opacity-80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5h.01"/></svg>';
    el.innerHTML = `${dot}<span>${msg}</span>`;
    host.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.remove('opacity-0', '-translate-y-2');
    });
    setTimeout(() => {
      el.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => el.remove(), 320);
    }, 2200);
  };

  // 全局点击委托：凡是带 data-toast 的元素，点击即弹提示（演示用）
  document.addEventListener('click', function (e) {
    const t = e.target.closest('[data-toast]');
    if (!t) return;
    if (t.tagName === 'A' && !t.getAttribute('href')) e.preventDefault();
    if (t.tagName === 'BUTTON' && t.type !== 'submit') e.preventDefault();
    AO.toast(t.getAttribute('data-toast'), t.getAttribute('data-toast-type') || 'success');
  });

  // ——— 多品牌：侧栏品牌切换器交互 ———
  AO.setBrand = applyBrand;

  function closeBrandMenu() {
    const menu = document.getElementById('ao-brand-menu');
    const caret = document.getElementById('ao-brand-caret');
    if (menu) menu.classList.add('hidden');
    if (caret) caret.style.transform = '';
  }

  document.addEventListener('click', function (e) {
    const menu = document.getElementById('ao-brand-menu');
    if (!menu) return;

    // 1) 点击切换器：展开 / 收起（caret 旋转用内联 style，避开 Play CDN 动态类陷阱）
    if (e.target.closest('#ao-brand-switch')) {
      e.preventDefault();
      const nowHidden = menu.classList.toggle('hidden');
      const caret = document.getElementById('ao-brand-caret');
      if (caret) caret.style.transform = nowHidden ? '' : 'rotate(180deg)';
      return;
    }

    // 2) 点击品牌行：切换当前品牌
    const row = e.target.closest('[data-brand]');
    if (row && menu.contains(row)) {
      e.preventDefault();
      const i = +row.getAttribute('data-brand');
      if (i !== curBrand) {
        applyBrand(i);
        AO.toast('已切换到「' + BRANDS[i].name + '」工作区', 'success');
      }
      closeBrandMenu();
      return;
    }

    // 3) 点击菜单外部：收起
    if (!menu.classList.contains('hidden') && !menu.contains(e.target)) closeBrandMenu();
  });
})();
