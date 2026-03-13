import React, { useState, useMemo, createContext, useContext, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList
} from "recharts";

// ─── K-HART BRAND TOKENS ─────────────────────────────────────────────────────
const B = {
  hartyGreen:  "#95C93D",   // Primary accent
  spyderGreen: "#48582C",   // Dark green
  deepBlack:   "#212121",   // True black
  raptorYellow:"#FED110",   // Sparingly only
  // UI surfaces — dark shades of Deep Black
  bg:          "#1A1A1A",   // Page background
  surface:     "#252525",   // Card surface
  surfaceHigh: "#2E2E2E",   // Elevated card
  border:      "#383838",   // Borders
  borderLight: "#424242",   // Lighter border
  // Text
  textPrimary: "#F0F0F0",   // Main text
  textSecond:  "#A8A8A8",   // Secondary text
  textMuted:   "#686868",   // Muted / labels
  // Feedback
  positive:    "#95C93D",   // Up delta — Harty Green
  negative:    "#E05050",   // Down delta
  // Platform colours — all K-Hart palette harmonised
  googlePaid:  "#95C93D",   // Harty Green
  googleOrganic:"#6BA82E",  // Slightly darker green
  analytics:   "#FED110",   // Raptor Yellow (used here as analytics accent)
  facebook:    "#6A9E5A",   // Muted green tint for FB
  instagram:   "#48582C",   // Spyder Green for IG
};

// ─── GLOBAL CONTEXT ──────────────────────────────────────────────────────────
const DashContext = createContext(null);
const useDash = () => useContext(DashContext);

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return { width, isMobile: width < 640, isTablet: width >= 640 && width < 1024, isDesktop: width >= 1024 };
}

// ─── DATA ────────────────────────────────────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
function generateDays(n, seeds, seedBase = 1) {
  const rand = seededRand(seedBase);
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (n - 1 - i));
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const trend = 0.62 + (i / n) * 0.76;
    return { date: label, ...Object.fromEntries(Object.entries(seeds).map(([k, s]) => [k, Math.max(1, Math.round(s * (0.72 + rand() * 0.56) * trend))])) };
  });
}

const CAMPAIGNS = {
  googlePaid: [
    { id:"gp1", name:"Brand — Exact Match",       color:"#95C93D", seeds:{ impressions:8200, clicks:620, spend:190, conversions:14 }, seedBase:11 },
    { id:"gp2", name:"Competitor Conquesting",     color:"#7AB832", seeds:{ impressions:5100, clicks:280, spend:95,  conversions:7  }, seedBase:22 },
    { id:"gp3", name:"Generic — High Intent",      color:"#5E9020", seeds:{ impressions:4400, clicks:200, spend:82,  conversions:5  }, seedBase:33 },
    { id:"gp4", name:"Retargeting — Cart Abandon", color:"#FED110", seeds:{ impressions:1960, clicks:88,  spend:38,  conversions:4  }, seedBase:44 },
  ],
  googleOrganic: [
    { id:"go1", name:"Blog / Editorial",           color:"#6BA82E", seeds:{ impressions:4200, clicks:310, sessions:280, conversions:6 }, seedBase:55 },
    { id:"go2", name:"Product Pages",              color:"#5A9028", seeds:{ impressions:2800, clicks:200, sessions:180, conversions:5 }, seedBase:66 },
    { id:"go3", name:"Landing Pages",              color:"#48582C", seeds:{ impressions:1700, clicks:110, sessions:95,  conversions:3 }, seedBase:77 },
  ],
  ga4: [
    { id:"ga1",  name:"Paid Search",               color:"#FED110", seeds:{ sessions:1800, users:1300, pageviews:5200, conversions:28, avgDuration:142 }, seedBase:154 },
    { id:"ga2",  name:"Organic Search",            color:"#D4AE0E", seeds:{ sessions:1200, users:900,  pageviews:3600, conversions:18, avgDuration:198 }, seedBase:165 },
    { id:"ga3",  name:"Paid Social",               color:"#A88A0B", seeds:{ sessions:800,  users:620,  pageviews:2200, conversions:11, avgDuration:88  }, seedBase:176 },
    { id:"ga4d", name:"Direct / Email",            color:"#7A6408", seeds:{ sessions:480,  users:370,  pageviews:1400, conversions:8,  avgDuration:165 }, seedBase:187 },
  ],
  facebook: [
    { id:"fb1", name:"Prospecting — Lookalike",    color:"#95C93D", seeds:{ impressions:14000, clicks:310, spend:82, conversions:5 }, seedBase:88 },
    { id:"fb2", name:"Retargeting — Visitors",     color:"#6BA82E", seeds:{ impressions:8200,  clicks:180, spend:48, conversions:3 }, seedBase:99 },
    { id:"fb3", name:"Brand Awareness",            color:"#48582C", seeds:{ impressions:6100,  clicks:95,  spend:32, conversions:2 }, seedBase:110 },
  ],
  instagram: [
    { id:"ig1", name:"Stories — Product Demo",     color:"#95C93D", seeds:{ impressions:18000, clicks:360, spend:55, conversions:6 }, seedBase:121 },
    { id:"ig2", name:"Feed — UGC Creative",        color:"#7AB832", seeds:{ impressions:13000, clicks:280, spend:42, conversions:5 }, seedBase:132 },
    { id:"ig3", name:"Reels — Top of Funnel",      color:"#48582C", seeds:{ impressions:10000, clicks:165, spend:28, conversions:3 }, seedBase:143 },
  ],
};
Object.values(CAMPAIGNS).flat().forEach(c => { c.data = generateDays(180, c.seeds, c.seedBase); });

const TOP_SEARCH_TERMS = [
  { term:"crm software for small business",  searches:18400, cpc:4.82, ctr:6.4, position:2.1, paid_clicks:1178, organic_clicks:2940, competition:"High"   },
  { term:"best project management tool",     searches:14200, cpc:3.95, ctr:5.8, position:3.4, paid_clicks:824,  organic_clicks:1840, competition:"High"   },
  { term:"email marketing platform",         searches:12800, cpc:5.20, ctr:7.1, position:1.8, paid_clicks:909,  organic_clicks:1536, competition:"High"   },
  { term:"free accounting software",         searches:11000, cpc:2.10, ctr:4.2, position:5.2, paid_clicks:462,  organic_clicks:924,  competition:"Medium" },
  { term:"customer support software",        searches:9600,  cpc:6.40, ctr:5.5, position:2.9, paid_clicks:528,  organic_clicks:1056, competition:"High"   },
  { term:"inventory management system",      searches:8200,  cpc:3.75, ctr:4.8, position:4.1, paid_clicks:394,  organic_clicks:656,  competition:"Medium" },
  { term:"hr software small business",       searches:7400,  cpc:4.15, ctr:5.2, position:3.7, paid_clicks:385,  organic_clicks:740,  competition:"Medium" },
  { term:"sales pipeline software",          searches:6900,  cpc:7.80, ctr:6.9, position:2.3, paid_clicks:476,  organic_clicks:621,  competition:"High"   },
  { term:"team collaboration tools",         searches:6100,  cpc:2.90, ctr:3.9, position:6.8, paid_clicks:238,  organic_clicks:488,  competition:"Low"    },
  { term:"business analytics dashboard",     searches:5400,  cpc:5.55, ctr:4.6, position:4.5, paid_clicks:248,  organic_clicks:432,  competition:"Medium" },
];

const COMP_COLORS = { High:"#E05050", Medium:"#FED110", Low:"#95C93D" };
const fmtK = v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : String(v ?? 0);
const fmtD = v => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${(+v||0).toFixed(2)}`;
const COMPARE_OPTS = [
  { value:"none",  label:"No comparison"    },
  { value:"prev",  label:"Previous period"  },
  { value:"mom",   label:"Month over month" },
  { value:"yoy",   label:"Year over year"   },
];

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
function toISO(date) {
  return date.toISOString().slice(0, 10);
}
function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function diffDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function fmtDisplay(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}
function defaultDates() {
  const end   = new Date(); end.setDate(end.getDate() - 1);
  const start = new Date(); start.setDate(start.getDate() - 30);
  return { start: toISO(start), end: toISO(end) };
}

// Slice data arrays based on actual dates
function sliceByDates(data, startISO, endISO) {
  // data rows have date like "Mar 3" — convert ISO to same format for matching
  const startD = new Date(startISO + 'T00:00:00');
  const endD   = new Date(endISO   + 'T00:00:00');
  const n = diffDays(startISO, endISO) + 1;
  // Fall back to slice-based for demo data (which uses "Mar 3" labels)
  return data.slice(-n);
}

function slicePeriods(data, startISO, endISO, compareMode) {
  const n = diffDays(startISO, endISO) + 1;
  const curr = data.slice(-n);
  let prev = null;
  if (compareMode === "prev") prev = data.slice(-n * 2, -n);
  else if (compareMode === "mom") prev = data.slice(-(n + 30), -30).slice(-n);
  else if (compareMode === "yoy") prev = data.slice(0, n);
  return { curr, prev };
}
function sumKeys(rows, keys) {
  return Object.fromEntries(keys.map(k => [k, rows.reduce((a,b) => a+(b[k]||0), 0)]));
}
function pctDelta(curr, prev) {
  if (!prev||prev===0) return null;
  return ((curr-prev)/prev)*100;
}

// ─── CAMPAIGN CHECKBOX TOGGLE ─────────────────────────────────────────────────
function useCampaignVisibility(campaigns) {
  const [hidden, setHidden] = useState(new Set());
  const toggle = (id) => setHidden(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll = () => {
    const allIds = campaigns.map(c=>c.id);
    setHidden(allIds.every(id=>hidden.has(id)) ? new Set() : new Set(allIds));
  };
  return { hidden, toggle, toggleAll, visible: campaigns.filter(c=>!hidden.has(c.id)) };
}

// ─── CAMPAIGN FILTER BAR ──────────────────────────────────────────────────────
function CampaignFilterBar({ campaigns, hidden, toggle, toggleAll }) {
  const bp = useBreakpoint();
  const allHidden = campaigns.every(c=>hidden.has(c.id));
  const someHidden = campaigns.some(c=>hidden.has(c.id));
  return (
    <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:6, background:B.bg, borderRadius:8, padding:bp.isMobile?"8px 10px":"10px 14px", border:`1px solid ${B.border}`, marginBottom:16 }}>
      <button onClick={toggleAll} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:6, border:`1px solid ${B.borderLight}`, background:"transparent", cursor:"pointer", fontSize:10, fontFamily:"'Barlow',sans-serif", color:B.textSecond, letterSpacing:"0.05em" }}>
        <span style={{ width:13, height:13, borderRadius:2, border:`1.5px solid ${someHidden?B.borderLight:B.hartyGreen}`, background:allHidden?"transparent":someHidden?B.surface:B.hartyGreen, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, position:"relative" }}>
          {!allHidden && someHidden && <span style={{ width:7, height:2, background:B.hartyGreen, borderRadius:1, position:"absolute" }}/>}
          {!allHidden && !someHidden && <span style={{ color:B.deepBlack, fontSize:9, fontWeight:900, lineHeight:1 }}>✓</span>}
        </span>
        ALL
      </button>
      <div style={{ width:1, height:18, background:B.border }}/>
      {campaigns.map(c => {
        const checked = !hidden.has(c.id);
        return (
          <button key={c.id} onClick={()=>toggle(c.id)} style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 11px", borderRadius:4, border:`1.5px solid ${checked?c.color+"88":B.border}`, background:checked?c.color+"18":"transparent", cursor:"pointer", fontSize:10, fontFamily:"'Barlow',sans-serif", color:checked?c.color:B.textMuted, transition:"all 0.12s", opacity:checked?1:0.55, letterSpacing:"0.03em" }}>
            <span style={{ width:12, height:12, borderRadius:2, flexShrink:0, border:`1.5px solid ${checked?c.color:B.borderLight}`, background:checked?c.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.12s" }}>
              {checked && <span style={{ color:B.deepBlack, fontSize:8, fontWeight:900, lineHeight:1 }}>✓</span>}
            </span>
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

// ─── SHARED UI ───────────────────────────────────────────────────────────────
function Delta({ value, inverted=false }) {
  if (value===null||isNaN(value)) return null;
  const pos = inverted ? value<0 : value>0;
  return <span style={{ fontSize:10, color:pos?B.positive:B.negative, fontFamily:"'Barlow Condensed',sans-serif", marginLeft:5, fontWeight:600 }}>{value>0?"▲":"▼"}{Math.abs(value).toFixed(1)}%</span>;
}

const LABEL_MAP = {
  conversions:  "Key Events",
  avgDuration:  "Avg Duration",
  pageviews:    "Pageviews",
  impressions:  "Impressions",
  reach:        "Reach",
  clicks:       "Clicks",
  linkClicks:   "Link Clicks",
  shares:       "Shares",
  comments:     "Comments",
  saves:        "Saves",
  reactions:    "Reactions",
  leads:        "Leads",
  sessions:     "Sessions",
  users:        "Users",
  spend:        "Spend",
  engagements:  "Engagements",
  newFans:      "New Fans",
  profileViews: "Profile Views",
  newFollowers: "New Followers",
  engaged:      "Accounts Engaged",
};
const fmtLabel = k => LABEL_MAP[k] || k;

function StatCard({ label, curr, prev, color, fmt=fmtK, inverted=false }) {
  const delta = prev!=null ? pctDelta(curr,prev) : null;
  return (
    <div style={{ background:B.surface, borderRadius:6, padding:"10px 14px", border:`1px solid ${B.border}`, flex:"1 1 110px", borderTop:`3px solid ${color||B.hartyGreen}` }}>
      <div style={{ fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", color:B.textMuted, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:5, fontWeight:600 }}>{fmtLabel(label)}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
        <span style={{ fontSize:18, fontWeight:700, color:color||B.textPrimary, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"-0.01em" }}>{fmt(curr)}</span>
        <Delta value={delta} inverted={inverted}/>
      </div>
      {prev!=null && <div style={{ fontSize:9, color:B.textMuted, marginTop:3, fontFamily:"'Barlow Condensed',sans-serif" }}>prev: {fmt(prev)}</div>}
    </div>
  );
}

function ChartTooltip({ active, payload, label, fmtVal }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:B.surfaceHigh, border:`1px solid ${B.borderLight}`, borderRadius:6, padding:"10px 14px", fontSize:11, fontFamily:"'Barlow',sans-serif", maxWidth:260 }}>
      <div style={{ color:B.textSecond, marginBottom:6, fontSize:10, letterSpacing:"0.05em" }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ color:p.color, marginBottom:2 }}>
          {p.name}: <strong>{fmtVal?fmtVal(p.name,p.value):fmtK(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title, accent }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
      <div style={{ width:4, height:22, background:accent||B.hartyGreen }}/>
      <span style={{ fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", color:B.textSecond, textTransform:"uppercase", letterSpacing:"0.18em", fontWeight:600 }}>{title}</span>
    </div>
  );
}

function CompareLabel({ compareMode }) {
  if (!compareMode||compareMode==="none") return null;
  const m = COMPARE_OPTS.find(o=>o.value===compareMode);
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:4, background:B.surface, border:`1px solid ${B.hartyGreen}44`, fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", color:B.hartyGreen, marginBottom:14, letterSpacing:"0.08em", fontWeight:600 }}>
      ⇄ COMPARING: {m?.label?.toUpperCase()}
      <span style={{ display:"inline-flex", gap:10, marginLeft:8, opacity:0.7 }}>
        <span style={{ color:B.textPrimary }}>— current</span>
        <span>- - prev</span>
      </span>
    </div>
  );
}

function ChartCard({ title, accent, children }) {
  return (
    <div style={{ background:B.surface, borderRadius:6, padding:"16px 18px", border:`1px solid ${B.border}`, borderLeft:`3px solid ${accent||B.hartyGreen}`, marginBottom:14 }}>
      <div style={{ fontSize:11, color:B.textSecond, fontWeight:600, marginBottom:14, fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:"0.1em" }}>{title}</div>
      {children}
    </div>
  );
}

// ─── CHART COMPONENTS ────────────────────────────────────────────────────────
function CampaignAreaChart({ campaigns, dataKey, height=200, fmtVal }) {
  const { startDate, endDate, compareMode } = useDash();
  const n = diffDays(startDate, endDate) + 1;
  const isSingleDay = n === 1;
  const comparing = compareMode && compareMode !== "none";
  const data = useMemo(() => {
    if (!campaigns.length) return [];

    // Build full date scaffold using YYYY-MM-DD keys, timezone-safe
    const scaffold = {};
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end   = new Date(ey, em - 1, ed);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const isoKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const label  = `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
      scaffold[isoKey] = { date: label };
      campaigns.forEach(c => { scaffold[isoKey][`curr_${c.id}`] = 0; });
    }

    // Merge campaign data using isoDate for exact scaffold key matching
    campaigns.forEach(c => {
      c.data.forEach(row => {
        if (row.isoDate && scaffold[row.isoDate]) {
          scaffold[row.isoDate][`curr_${c.id}`] = row[dataKey] ?? 0;
        }
      });
    });

    return Object.values(scaffold);
  }, [campaigns, startDate, endDate, compareMode, dataKey]);

  if (!campaigns.length) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:B.textMuted, fontSize:11, fontFamily:"'Barlow',sans-serif" }}>No campaigns selected</div>;

  // Single day — show a horizontal bar chart instead of area chart
  if (isSingleDay) {
    const barData = campaigns.map(c => ({
      name: c.name.length>26 ? c.name.slice(0,26)+"…" : c.name,
      curr: c.data.slice(-1)[0]?.[dataKey] ?? 0,
      color: c.color,
    }));
    const dynamicHeight = Math.max(height, barData.length * 36 + 40);
    return (
      <ResponsiveContainer width="100%" height={dynamicHeight}>
        <BarChart data={barData} layout="vertical" margin={{ left:0, right:24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={B.border} horizontal={false}/>
          <XAxis type="number" tick={{ fill:B.textMuted, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} axisLine={false} tickFormatter={fmtK}/>
          <YAxis type="category" dataKey="name" tick={{ fill:B.textSecond, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} axisLine={false} width={175}/>
          <Tooltip content={<ChartTooltip fmtVal={fmtVal}/>}/>
          <Bar dataKey="curr" name={dataKey} radius={[0,3,3,0]} opacity={0.9}>
            {barData.map((e,i)=><Cell key={i} fill={e.color}/>)}
            <LabelList dataKey="curr" position="right" formatter={v=>fmtK(v)} style={{ fill:B.textSecond, fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 }}/>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>{campaigns.map(c=>(
          <linearGradient key={c.id} id={`ag_${c.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={c.color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={c.color} stopOpacity={0}/>
          </linearGradient>
        ))}</defs>
        <CartesianGrid strokeDasharray="3 3" stroke={B.border}/>
        <XAxis dataKey="date" tick={{ fill:B.textMuted, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} interval="preserveStartEnd"/>
        <YAxis tick={{ fill:B.textMuted, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} axisLine={false} tickFormatter={fmtK}/>
        <Tooltip content={<ChartTooltip fmtVal={fmtVal}/>}/>
        <Legend wrapperStyle={{ fontSize:10, fontFamily:"'Barlow',sans-serif", color:B.textSecond }}/>
        {campaigns.map(c=>[
          <Area key={`c_${c.id}`} type="monotone" dataKey={`curr_${c.id}`} name={c.name} stroke={c.color} fill={`url(#ag_${c.id})`} strokeWidth={2}
            dot={n<=14 ? { r:3, fill:c.color, strokeWidth:0 } : false}
            label={n<=14 ? { position:'top', formatter:fmtK, style:{ fill:c.color, fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 } } : false}/>,
          comparing && <Line key={`p_${c.id}`} type="monotone" dataKey={`prev_${c.id}`} name={`${c.name} (prev)`} stroke={c.color} strokeDasharray="4 3" strokeWidth={1.5} dot={false} strokeOpacity={0.4}/>
        ])}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CampaignBarChart({ campaigns, dataKey, height=160, fmtVal }) {
  const { startDate, endDate, compareMode } = useDash();
  const comparing = compareMode && compareMode !== "none";
  const data = useMemo(() => campaigns.map(c => {
    const { curr, prev } = slicePeriods(c.data, startDate, endDate, compareMode);
    return { name:c.name.length>26?c.name.slice(0,26)+"…":c.name, curr:curr.reduce((a,b)=>a+(b[dataKey]||0),0), prev:prev?prev.reduce((a,b)=>a+(b[dataKey]||0),0):null, color:c.color };
  }), [campaigns, startDate, endDate, compareMode, dataKey]);

  if (!campaigns.length) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:B.textMuted, fontSize:11, fontFamily:"'Barlow',sans-serif" }}>No campaigns selected</div>;

  const dynamicHeight = Math.max(height, data.length * 36 + 40);

  return (
    <ResponsiveContainer width="100%" height={dynamicHeight}>
      <BarChart data={data} layout="vertical" margin={{ left:0, right:52 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke={B.border} horizontal={false}/>
        <XAxis type="number" tick={{ fill:B.textMuted, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} axisLine={false} tickFormatter={fmtK}/>
        <YAxis type="category" dataKey="name" tick={{ fill:B.textSecond, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} axisLine={false} width={175}/>
        <Tooltip content={<ChartTooltip fmtVal={fmtVal}/>}/>
        {comparing && <Legend wrapperStyle={{ fontSize:9, fontFamily:"'Barlow',sans-serif", color:B.textSecond }}/>}
        <Bar dataKey="curr" name="Current" radius={[0,3,3,0]} opacity={0.9}>
          {data.map((e,i)=><Cell key={i} fill={e.color}/>)}
          <LabelList dataKey="curr" position="right" formatter={v=>fmtK(v)} style={{ fill:B.textSecond, fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 }}/>
        </Bar>
        {comparing && <Bar dataKey="prev" name="Prev. period" fill={B.borderLight} radius={[0,3,3,0]} opacity={0.5}>
          <LabelList dataKey="prev" position="right" formatter={v=>v?fmtK(v):''} style={{ fill:B.textMuted, fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 }}/>
        </Bar>}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── CAMPAIGN TABLE ──────────────────────────────────────────────────────────
function CampaignTable({ allCampaigns, hidden, toggle, toggleAll, metricKeys, fmtCell }) {
  const { startDate, endDate, compareMode } = useDash();
  const [sortKey, setSortKey] = useState(metricKeys[0]);
  const [sortDir, setSortDir] = useState("desc");
  const comparing = compareMode && compareMode !== "none";
  const rows = allCampaigns.map(c => {
    const { curr, prev } = slicePeriods(c.data, startDate, endDate, compareMode);
    const currSum = sumKeys(curr, metricKeys);
    const prevSum = prev ? sumKeys(prev, metricKeys) : null;
    if (metricKeys.includes('avgDuration') && curr.length > 0)
      currSum.avgDuration = Math.round(curr.reduce((a,b)=>a+(b.avgDuration||0),0) / curr.length);
    if (prevSum && metricKeys.includes('avgDuration') && prev && prev.length > 0)
      prevSum.avgDuration = Math.round(prev.reduce((a,b)=>a+(b.avgDuration||0),0) / prev.length);
    return { ...c, currSum, prevSum };
  }).sort((a,b)=>sortDir==="desc"?b.currSum[sortKey]-a.currSum[sortKey]:a.currSum[sortKey]-b.currSum[sortKey]);

  const thStyle = { padding:"9px 14px", fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:"0.12em", borderBottom:`1px solid ${B.border}`, fontWeight:600 };

  return (
    <div style={{ background:B.bg, borderRadius:6, border:`1px solid ${B.border}`, overflow:"hidden", marginTop:14 }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ background:B.surface }}>
            <th style={{ width:36, padding:"9px 0 9px 14px", borderBottom:`1px solid ${B.border}` }}>
              <span onClick={toggleAll} style={{ width:13, height:13, borderRadius:2, border:`1.5px solid ${B.borderLight}`, background:allCampaigns.every(c=>!hidden.has(c.id))?B.hartyGreen:allCampaigns.some(c=>!hidden.has(c.id))?B.surface:"transparent", display:"inline-flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
                {allCampaigns.every(c=>!hidden.has(c.id))&&<span style={{ color:B.deepBlack, fontSize:8, fontWeight:900 }}>✓</span>}
                {!allCampaigns.every(c=>!hidden.has(c.id))&&allCampaigns.some(c=>!hidden.has(c.id))&&<span style={{ width:7, height:2, background:B.hartyGreen, borderRadius:1, position:"absolute" }}/>}
              </span>
            </th>
            <th style={{ ...thStyle, textAlign:"left", color:B.textMuted }}>Source</th>
            {metricKeys.map(k=>(
              <th key={k} onClick={()=>k===sortKey?setSortDir(d=>d==="desc"?"asc":"desc"):(setSortKey(k),setSortDir("desc"))}
                style={{ ...thStyle, textAlign:"right", color:sortKey===k?B.hartyGreen:B.textMuted, cursor:"pointer", userSelect:"none", whiteSpace:"nowrap" }}>
                {fmtLabel(k)}{sortKey===k?(sortDir==="desc"?" ↓":" ↑"):""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row=>{
            const isVisible = !hidden.has(row.id);
            return (
              <tr key={row.id} style={{ borderBottom:`1px solid ${B.border}`, opacity:isVisible?1:0.3, transition:"opacity 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=B.surface}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"10px 0 10px 14px", verticalAlign:"middle" }}>
                  <span onClick={()=>toggle(row.id)} style={{ width:13, height:13, borderRadius:2, border:`1.5px solid ${isVisible?row.color:B.borderLight}`, background:isVisible?row.color:"transparent", display:"inline-flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.12s" }}>
                    {isVisible&&<span style={{ color:B.deepBlack, fontSize:8, fontWeight:900, lineHeight:1 }}>✓</span>}
                  </span>
                </td>
                <td style={{ padding:"10px 14px", verticalAlign:"middle" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:1, background:row.color, flexShrink:0 }}/>
                    <span style={{ color:isVisible?B.textPrimary:B.textMuted, fontWeight:500, fontFamily:"'Barlow',sans-serif", fontSize:12 }}>{row.name}</span>
                  </div>
                </td>
                {metricKeys.map(k=>{
                  const delta = row.prevSum?pctDelta(row.currSum[k],row.prevSum[k]):null;
                  return (
                    <td key={k} style={{ textAlign:"right", padding:"10px 14px", fontFamily:"'Barlow Condensed',sans-serif" }}>
                      <span style={{ color:isVisible?row.color:B.textMuted, fontSize:13, fontWeight:600 }}>{fmtCell(k,row.currSum[k])}</span>
                      {delta!==null&&isVisible&&<span style={{ fontSize:9, color:delta>=0?B.positive:B.negative, marginLeft:5, fontWeight:600 }}>{delta>=0?"▲":"▼"}{Math.abs(delta).toFixed(0)}%</span>}
                      {comparing&&row.prevSum&&isVisible&&<div style={{ fontSize:9, color:B.textMuted }}>{fmtCell(k,row.prevSum[k])}</div>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── CHART SIDEBAR ────────────────────────────────────────────────────────────
function ChartSidebar({ campaigns, hidden, toggle, toggleAll, accent }) {
  return (
    <div style={{
      position:"sticky", top:72, alignSelf:"flex-start",
      width:200, flexShrink:0,
      background:B.surface, borderRadius:6, border:`1px solid ${B.border}`,
      borderTop:`3px solid ${accent||B.hartyGreen}`,
      padding:"14px 12px",
    }}>
      <div style={{ fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", color:B.textMuted, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:600, marginBottom:12 }}>Sources</div>
      {/* Select all */}
      <button onClick={toggleAll} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", background:"transparent", border:"none", cursor:"pointer", padding:"4px 0", marginBottom:8 }}>
        <span style={{
          width:13, height:13, borderRadius:2, flexShrink:0,
          border:`1.5px solid ${campaigns.every(c=>!hidden.has(c.id))?B.hartyGreen:B.borderLight}`,
          background:campaigns.every(c=>!hidden.has(c.id))?B.hartyGreen:campaigns.some(c=>!hidden.has(c.id))?B.surface:"transparent",
          display:"inline-flex", alignItems:"center", justifyContent:"center", position:"relative",
        }}>
          {campaigns.every(c=>!hidden.has(c.id))&&<span style={{ color:B.deepBlack, fontSize:8, fontWeight:900 }}>✓</span>}
          {!campaigns.every(c=>!hidden.has(c.id))&&campaigns.some(c=>!hidden.has(c.id))&&<span style={{ width:7, height:2, background:B.hartyGreen, borderRadius:1, position:"absolute" }}/>}
        </span>
        <span style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", color:B.textSecond, fontWeight:700, letterSpacing:"0.08em" }}>ALL</span>
      </button>
      <div style={{ height:1, background:B.border, marginBottom:8 }}/>
      {/* Individual campaigns */}
      {campaigns.map(c => {
        const checked = !hidden.has(c.id);
        return (
          <button key={c.id} onClick={()=>toggle(c.id)} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", background:"transparent", border:"none", cursor:"pointer", padding:"5px 0", opacity:checked?1:0.4, transition:"opacity 0.15s" }}>
            <span style={{
              width:13, height:13, borderRadius:2, flexShrink:0,
              border:`1.5px solid ${checked?c.color:B.borderLight}`,
              background:checked?c.color:"transparent",
              display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"all 0.12s",
            }}>
              {checked&&<span style={{ color:B.deepBlack, fontSize:8, fontWeight:900, lineHeight:1 }}>✓</span>}
            </span>
            <span style={{ fontSize:10, fontFamily:"'Barlow',sans-serif", color:checked?B.textPrimary:B.textMuted, textAlign:"left", lineHeight:1.3 }}>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── SECTION BUILDER ─────────────────────────────────────────────────────────
function Section({ campaignKey, title, accent, metricKeys, charts, tableFmt }) {
  const { startDate, endDate, compareMode } = useDash();
  const bp = useBreakpoint();
  const allCampaigns = CAMPAIGNS[campaignKey];
  const { hidden, toggle, toggleAll, visible } = useCampaignVisibility(allCampaigns);
  const allCurr = allCampaigns.flatMap(c=>slicePeriods(c.data,startDate,endDate,compareMode).curr);
  const allPrev = compareMode&&compareMode!=="none" ? allCampaigns.flatMap(c=>slicePeriods(c.data,startDate,endDate,compareMode).prev||[]) : null;
  const tc = sumKeys(allCurr,metricKeys);
  const tp = allPrev ? sumKeys(allPrev,metricKeys) : {};

  const chartContent = (
    <>
      {charts.map((chart,ci)=>{
        if (chart.type==="area") return <ChartCard key={ci} title={chart.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={chart.dataKey} height={bp.isMobile?150:chart.height||200} fmtVal={chart.fmtVal}/></ChartCard>;
        if (chart.type==="area-pair") return (
          <div key={ci} style={{ display:"grid", gridTemplateColumns:bp.isMobile?"1fr":"1fr 1fr", gap:14 }}>
            {chart.items.map((item,ii)=>(<ChartCard key={ii} title={item.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={item.dataKey} height={bp.isMobile?140:160} fmtVal={item.fmtVal}/></ChartCard>))}
          </div>
        );
        if (chart.type==="area-quad") return (
          <div key={ci} style={{ display:"grid", gridTemplateColumns:bp.isMobile?"1fr":"1fr 1fr", gap:14 }}>
            {chart.items.map((item,ii)=>(<ChartCard key={ii} title={item.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={item.dataKey} height={bp.isMobile?130:150} fmtVal={item.fmtVal}/></ChartCard>))}
          </div>
        );
        if (chart.type==="bar") return <ChartCard key={ci} title={chart.title} accent={accent}><CampaignBarChart campaigns={visible} dataKey={chart.dataKey} height={chart.height||160} fmtVal={chart.fmtVal}/></ChartCard>;
        return null;
      })}
      <CampaignTable allCampaigns={allCampaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll} metricKeys={metricKeys} fmtCell={tableFmt}/>
    </>
  );

  return (
    <>
      <SectionHeader title={title} accent={accent}/>
      <CompareLabel compareMode={compareMode}/>
      <div style={{ display:"flex", gap:bp.isMobile?6:10, flexWrap:"wrap", marginBottom:16 }}>
        {metricKeys.map(k=>(<StatCard key={k} label={k} curr={tc[k]} prev={tp[k]} color={accent} fmt={k==="spend"?fmtD:k==="avgDuration"?(v=>`${Math.floor(v/60)}m ${String(v%60).padStart(2,'0')}s`):fmtK}/>))}
      </div>
      {bp.isMobile ? (
        <>
          <CampaignFilterBar campaigns={allCampaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll}/>
          {chartContent}
        </>
      ) : (
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <div style={{ flex:1, minWidth:0 }}>{chartContent}</div>
          <ChartSidebar campaigns={allCampaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll} accent={accent}/>
        </div>
      )}
    </>
  );
}

// ─── SECTION CONFIGS ─────────────────────────────────────────────────────────
const SECTIONS = {
  googlePaid: {
    campaignKey:"googlePaid", title:"Google Ads — Paid Search", accent:B.hartyGreen,
    metricKeys:["impressions","clicks","spend","conversions"],
    tableFmt:(k,v)=>k==="spend"?`$${v.toLocaleString()}`:v.toLocaleString(),
    charts:[
      { type:"area", title:"Impressions over Time", dataKey:"impressions" },
      { type:"area-pair", items:[{ title:"Spend", dataKey:"spend", fmtVal:(_,v)=>`$${v}` },{ title:"Conversions", dataKey:"conversions" }]},
      { type:"bar", title:"Total Clicks by Campaign", dataKey:"clicks" },
    ],
  },
  googleOrganic: {
    campaignKey:"googleOrganic", title:"Google Search — Organic", accent:"#6BA82E",
    metricKeys:["impressions","clicks","sessions","conversions"],
    tableFmt:(_,v)=>v.toLocaleString(),
    charts:[
      { type:"area", title:"Clicks over Time", dataKey:"clicks" },
      { type:"area-pair", items:[{ title:"Sessions", dataKey:"sessions" },{ title:"Conversions", dataKey:"conversions" }]},
      { type:"bar", title:"Total Impressions by Content Type", dataKey:"impressions" },
    ],
  },
  analytics: {
    campaignKey:"ga4", title:"Google Analytics 4 — Channels", accent:B.raptorYellow,
    metricKeys:["sessions","users","pageviews","conversions","avgDuration"],
    tableFmt:(k,v)=>k==="avgDuration"?`${Math.floor(v/60)}m ${String(v%60).padStart(2,'0')}s`:v.toLocaleString(),
    charts:[
      { type:"area", title:"Sessions over Time", dataKey:"sessions" },
      { type:"area-pair", items:[
        { title:"Key Events", dataKey:"conversions" },
        { title:"Pageviews", dataKey:"pageviews" },
      ]},
      { type:"bar", title:"Total Pageviews by Channel", dataKey:"pageviews" },
    ],
  },
  facebook: {
    campaignKey:"facebook", title:"Facebook — Campaigns", accent:"#6BA82E",
    metricKeys:["impressions","reach","spend","linkClicks","reactions","comments","shares","saves","leads"],
    tableFmt:(k,v)=>k==="spend"?`$${v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`:v.toLocaleString(),
    charts:[
      { type:"area-pair", items:[
        { title:"Impressions over Time", dataKey:"impressions" },
        { title:"Reach over Time",       dataKey:"reach" },
      ]},
      { type:"area-pair", items:[
        { title:"Spend over Time",       dataKey:"spend",      fmtVal:(_,v)=>`$${fmtD(v)}` },
        { title:"Link Clicks over Time", dataKey:"linkClicks" },
      ]},
      { type:"area-quad", items:[
        { title:"Reactions over Time",   dataKey:"reactions" },
        { title:"Comments over Time",    dataKey:"comments"  },
        { title:"Shares over Time",      dataKey:"shares"    },
        { title:"Saves over Time",       dataKey:"saves"     },
      ]},
      { type:"bar", title:"Total Link Clicks by Campaign", dataKey:"linkClicks" },
      { type:"bar", title:"Total Leads by Campaign",       dataKey:"leads",  height:140 },
    ],
  },
  instagram: {
    campaignKey:"instagram", title:"Instagram — Campaigns", accent:B.spyderGreen,
    metricKeys:["impressions","reach","spend","linkClicks","reactions","comments","shares","saves","leads"],
    tableFmt:(k,v)=>k==="spend"?`$${v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`:v.toLocaleString(),
    charts:[
      { type:"area-pair", items:[
        { title:"Impressions over Time", dataKey:"impressions" },
        { title:"Reach over Time",       dataKey:"reach" },
      ]},
      { type:"area-pair", items:[
        { title:"Spend over Time",       dataKey:"spend",      fmtVal:(_,v)=>`$${fmtD(v)}` },
        { title:"Link Clicks over Time", dataKey:"linkClicks" },
      ]},
      { type:"area-quad", items:[
        { title:"Reactions over Time",   dataKey:"reactions" },
        { title:"Comments over Time",    dataKey:"comments"  },
        { title:"Shares over Time",      dataKey:"shares"    },
        { title:"Saves over Time",       dataKey:"saves"     },
      ]},
      { type:"bar", title:"Total Link Clicks by Campaign", dataKey:"linkClicks" },
      { type:"bar", title:"Total Leads by Campaign",       dataKey:"leads",  height:140 },
    ],
  },
};

// ─── SEARCH TERMS ────────────────────────────────────────────────────────────
function SearchTermsSection() {
  const [sortKey, setSortKey] = useState("searches");
  const [sortDir, setSortDir] = useState("desc");
  const [chartMetric, setChartMetric] = useState("searches");
  const sorted = [...TOP_SEARCH_TERMS].sort((a,b)=>sortDir==="desc"?b[sortKey]-a[sortKey]:a[sortKey]-b[sortKey]);
  const metricOpts = [
    { key:"searches",       label:"Searches",    color:B.hartyGreen },
    { key:"paid_clicks",    label:"Paid",        color:B.raptorYellow },
    { key:"organic_clicks", label:"Organic",     color:"#6BA82E" },
    { key:"cpc",            label:"CPC",         color:B.textSecond },
    { key:"ctr",            label:"CTR",         color:B.spyderGreen },
  ];
  const am = metricOpts.find(m=>m.key===chartMetric);
  const chartData = [...TOP_SEARCH_TERMS].sort((a,b)=>b[chartMetric]-a[chartMetric]).map(t=>({ name:t.term.length>28?t.term.slice(0,28)+"…":t.term, value:t[chartMetric] }));
  const cols = ["term","searches","cpc","ctr","position","paid_clicks","organic_clicks","competition"];
  const fmtCell = (k,v) => k==="cpc"?`$${v.toFixed(2)}`:k==="ctr"?`${v}%`:k==="position"?v.toFixed(1):typeof v==="number"?v.toLocaleString():v;

  return (
    <>
      <SectionHeader title="Top 10 Search Terms" accent={B.hartyGreen}/>
      <div style={{ background:B.surface, borderRadius:6, padding:"16px 18px", border:`1px solid ${B.border}`, borderLeft:`3px solid ${B.hartyGreen}`, marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
          <span style={{ fontSize:11, color:B.textSecond, fontWeight:600, fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:"0.1em" }}>Term Performance</span>
          <div style={{ display:"flex", gap:3, background:B.bg, borderRadius:5, padding:3, border:`1px solid ${B.border}` }}>
            {metricOpts.map(m=>(
              <button key={m.key} onClick={()=>setChartMetric(m.key)} style={{ padding:"4px 10px", borderRadius:4, border:"none", cursor:"pointer", fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", background:chartMetric===m.key?m.color:"transparent", color:chartMetric===m.key?B.deepBlack:B.textMuted, fontWeight:700, transition:"all 0.15s", letterSpacing:"0.06em" }}>{m.label}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical" margin={{ left:0, right:30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={B.border} horizontal={false}/>
            <XAxis type="number" tick={{ fill:B.textMuted, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} axisLine={false} tickFormatter={v=>chartMetric==="cpc"?`$${v}`:chartMetric==="ctr"?`${v}%`:fmtK(v)}/>
            <YAxis type="category" dataKey="name" tick={{ fill:B.textSecond, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} axisLine={false} width={185}/>
            <Tooltip content={<ChartTooltip fmtVal={(_,v)=>chartMetric==="cpc"?`$${v.toFixed(2)}`:chartMetric==="ctr"?`${v}%`:v.toLocaleString()}/>}/>
            <Bar dataKey="value" fill={am.color} radius={[0,3,3,0]} opacity={0.9}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background:B.surface, borderRadius:6, border:`1px solid ${B.border}`, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:B.bg }}>
                {cols.map(c=>(
                  <th key={c} onClick={()=>c!=="term"&&c!=="competition"&&(c===sortKey?setSortDir(d=>d==="desc"?"asc":"desc"):(setSortKey(c),setSortDir("desc")))}
                    style={{ textAlign:"left", padding:"10px 14px", fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:"0.12em", color:sortKey===c?B.hartyGreen:B.textMuted, cursor:c!=="term"&&c!=="competition"?"pointer":"default", borderBottom:`1px solid ${B.border}`, userSelect:"none", whiteSpace:"nowrap", fontWeight:600 }}>
                    {c.replace(/_/g," ")}{sortKey===c?(sortDir==="desc"?" ↓":" ↑"):""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row,i)=>(
                <tr key={row.term} style={{ borderBottom:`1px solid ${B.border}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=B.surface}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {cols.map(c=>(
                    <td key={c} style={{ padding:"10px 14px", color:B.textSecond, verticalAlign:"middle" }}>
                      {c==="term"?(<div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ width:18, height:18, borderRadius:3, background:B.surface, border:`1px solid ${B.border}`, color:B.textMuted, fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</span><span style={{ fontWeight:500, color:B.textPrimary, fontFamily:"'Barlow',sans-serif" }}>{row.term}</span></div>)
                      :c==="competition"?(<span style={{ fontSize:10, padding:"2px 8px", borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"0.08em", background:`${COMP_COLORS[row.competition]}22`, color:COMP_COLORS[row.competition] }}>{row[c].toUpperCase()}</span>)
                      :c==="searches"?(<div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ height:3, borderRadius:99, background:B.hartyGreen, width:`${Math.round((row.searches/18400)*48)}px`, minWidth:3 }}/><span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 }}>{row.searches.toLocaleString()}</span></div>)
                      :(<span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, color:c==="cpc"?B.raptorYellow:c==="paid_clicks"?B.hartyGreen:c==="organic_clicks"?"#6BA82E":c==="position"?(row.position<=3?B.positive:row.position<=6?B.raptorYellow:B.negative):B.textSecond }}>{fmtCell(c,row[c])}</span>)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── COMPARE DROPDOWN ────────────────────────────────────────────────────────
function CompareDropdown({ value, onChange, compact=false }) {
  const [open, setOpen] = useState(false);
  const current = COMPARE_OPTS.find(o=>o.value===value);
  const isActive = value && value !== "none";
  return (
    <div style={{ position:"relative" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:6, padding:compact?"5px 10px":"7px 14px", borderRadius:4, border:`1px solid ${isActive?B.hartyGreen:B.border}`, background:isActive?B.hartyGreen+"22":B.surface, cursor:"pointer", fontSize:compact?9:11, fontFamily:"'Barlow Condensed',sans-serif", color:isActive?B.hartyGreen:B.textSecond, transition:"all 0.15s", whiteSpace:"nowrap", letterSpacing:"0.06em", fontWeight:600 }}>
        <span>⇄</span>
        {!compact && (isActive?current.label.toUpperCase():"COMPARE TO…")}
        {compact && <span>{isActive?"ON":"CMP"}</span>}
        <span style={{ fontSize:9, opacity:0.6 }}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:B.surfaceHigh, border:`1px solid ${B.borderLight}`, borderRadius:6, overflow:"hidden", zIndex:200, minWidth:190, boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
          {COMPARE_OPTS.map(opt=>(
            <button key={opt.value} onClick={()=>{ onChange(opt.value); setOpen(false); }} style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 16px", border:"none", cursor:"pointer", fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", background:value===opt.value?B.hartyGreen+"22":"transparent", color:value===opt.value?B.hartyGreen:B.textSecond, transition:"background 0.1s", letterSpacing:"0.05em", fontWeight:600 }}
              onMouseEnter={e=>e.currentTarget.style.background=B.border}
              onMouseLeave={e=>e.currentTarget.style.background=value===opt.value?B.hartyGreen+"22":"transparent"}>
              {opt.value==="none"?<span style={{ opacity:0.5 }}>{opt.label.toUpperCase()}</span>:opt.label.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LIVE SECTION (uses injected campaigns instead of CAMPAIGNS lookup) ───────
function LiveSection({ campaigns, title, accent, metricKeys, charts, tableFmt }) {
  const { startDate, endDate, compareMode } = useDash();
  const bp = useBreakpoint();
  const { hidden, toggle, toggleAll, visible } = useCampaignVisibility(campaigns);

  const { tc, tp } = useMemo(() => {
    const allCurr = campaigns.flatMap(c => slicePeriods(c.data, startDate, endDate, compareMode).curr);
    const allPrev = compareMode && compareMode !== "none"
      ? campaigns.flatMap(c => slicePeriods(c.data, startDate, endDate, compareMode).prev || [])
      : null;

    const tc = sumKeys(allCurr, metricKeys);
    if (metricKeys.includes('avgDuration')) {
      let totalWeightedDuration = 0;
      let totalSessions = 0;
      campaigns.forEach(c => {
        slicePeriods(c.data, startDate, endDate, compareMode).curr.forEach(row => {
          totalWeightedDuration += (row.avgDuration||0) * (row.sessions||1);
          totalSessions += (row.sessions||1);
        });
      });
      tc.avgDuration = totalSessions > 0 ? Math.round(totalWeightedDuration / totalSessions) : 0;
    }

    const tp = allPrev ? sumKeys(allPrev, metricKeys) : {};
    if (allPrev && metricKeys.includes('avgDuration')) {
      let totalWeightedDuration = 0;
      let totalSessions = 0;
      campaigns.forEach(c => {
        (slicePeriods(c.data, startDate, endDate, compareMode).prev || []).forEach(row => {
          totalWeightedDuration += (row.avgDuration||0) * (row.sessions||1);
          totalSessions += (row.sessions||1);
        });
      });
      tp.avgDuration = totalSessions > 0 ? Math.round(totalWeightedDuration / totalSessions) : 0;
    }

    return { tc, tp };
  }, [campaigns, startDate, endDate, compareMode, metricKeys]);

  return (
    <>
      <SectionHeader title={title} accent={accent}/>
      <CompareLabel compareMode={compareMode}/>
      <div style={{ display:"flex", gap:bp.isMobile?6:10, flexWrap:"wrap", marginBottom:16 }}>
        {metricKeys.map(k=>(
          <StatCard key={k} label={k} curr={tc[k]} prev={tp[k]} color={accent}
            fmt={k==="spend" ? fmtD : k==="avgDuration" ? (v=>`${Math.floor(v/60)}m${v%60>0?` ${String(v%60).padStart(2,'0')}s`:''}`) : fmtK}/>
        ))}
      </div>
      {bp.isMobile ? (
        <>
          <CampaignFilterBar campaigns={campaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll}/>
          {charts.map((chart,ci)=>{
            if (chart.type==="area") return <ChartCard key={ci} title={chart.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={chart.dataKey} height={150} fmtVal={chart.fmtVal}/></ChartCard>;
            if (chart.type==="area-pair") return <div key={ci} style={{ display:"flex", flexDirection:"column", gap:14 }}>{chart.items.map((item,ii)=>(<ChartCard key={ii} title={item.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={item.dataKey} height={140} fmtVal={item.fmtVal}/></ChartCard>))}</div>;
            if (chart.type==="area-quad") return <div key={ci} style={{ display:"flex", flexDirection:"column", gap:14 }}>{chart.items.map((item,ii)=>(<ChartCard key={ii} title={item.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={item.dataKey} height={130} fmtVal={item.fmtVal}/></ChartCard>))}</div>;
            if (chart.type==="bar") return <ChartCard key={ci} title={chart.title} accent={accent}><CampaignBarChart campaigns={visible} dataKey={chart.dataKey} height={chart.height||160} fmtVal={chart.fmtVal}/></ChartCard>;
            return null;
          })}
          <CampaignTable allCampaigns={campaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll} metricKeys={metricKeys} fmtCell={tableFmt}/>
        </>
      ) : (
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <div style={{ flex:1, minWidth:0 }}>
            {charts.map((chart,ci)=>{
              if (chart.type==="area") return <ChartCard key={ci} title={chart.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={chart.dataKey} height={chart.height||200} fmtVal={chart.fmtVal}/></ChartCard>;
              if (chart.type==="area-pair") return (
                <div key={ci} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {chart.items.map((item,ii)=>(<ChartCard key={ii} title={item.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={item.dataKey} height={160} fmtVal={item.fmtVal}/></ChartCard>))}
                </div>
              );
              if (chart.type==="area-quad") return (
                <div key={ci} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {chart.items.map((item,ii)=>(<ChartCard key={ii} title={item.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={item.dataKey} height={150} fmtVal={item.fmtVal}/></ChartCard>))}
                </div>
              );
              if (chart.type==="bar") return <ChartCard key={ci} title={chart.title} accent={accent}><CampaignBarChart campaigns={visible} dataKey={chart.dataKey} height={chart.height||160} fmtVal={chart.fmtVal}/></ChartCard>;
              return null;
            })}
            <CampaignTable allCampaigns={campaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll} metricKeys={metricKeys} fmtCell={tableFmt}/>
          </div>
          <ChartSidebar campaigns={campaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll} accent={accent}/>
        </div>
      )}
    </>
  );
}

// ─── COUNTRY DATA HOOK ───────────────────────────────────────────────────────
function useCountryData() {
  const { startDate, endDate } = useDash();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/ga4/countries?start=${startDate}&end=${endDate}`)
      .then(r => r.json())
      .then(rows => { setData(Array.isArray(rows) ? rows : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [startDate, endDate]);
  return { data, loading };
}

// ─── COUNTRY MAP + TABLE ─────────────────────────────────────────────────────
function CountrySection() {
  const { data, loading } = useCountryData();
  const [tooltip, setTooltip] = useState(null); // { x, y, country }
  const [sortKey, setSortKey] = useState('sessions');
  const [sortDir, setSortDir] = useState('desc');
  const bp = useBreakpoint();

  const maxSessions = data.length ? Math.max(...data.map(d => d.sessions)) : 1;

  const sorted = [...data].sort((a,b) =>
    sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
  );

  const thStyle = {
    padding:"9px 14px", fontSize:9, fontFamily:"'Barlow Condensed',sans-serif",
    textTransform:"uppercase", letterSpacing:"0.12em",
    borderBottom:`1px solid ${B.border}`, fontWeight:600, cursor:"pointer",
    userSelect:"none", whiteSpace:"nowrap",
  };

  // Build a lookup by ISO country code for map colouring
  const byCode = {};
  data.forEach(d => { byCode[d.countryCode] = d; });

  return (
    <>
      <div style={{ height:1, background:B.border, margin:"32px 0 28px" }}/>
      <div style={{ fontSize:13, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700,
        color:B.textPrimary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:16 }}>
        Traffic by Country
      </div>

      {loading && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0",
          color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, letterSpacing:"0.1em" }}>
          <div style={{ width:14, height:14, border:`2px solid ${B.raptorYellow}`,
            borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
          LOADING COUNTRY DATA…
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          {/* World Map */}
          <div style={{ background:B.surface, borderRadius:6, border:`1px solid ${B.border}`,
            borderLeft:`3px solid ${B.raptorYellow}`, padding:"16px 18px", marginBottom:14,
            position:"relative" }}>
            <div style={{ fontSize:11, color:B.textSecond, fontWeight:600, marginBottom:12,
              fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:"0.1em" }}>
              Sessions by Country
            </div>
            <MapSVG byCode={byCode} maxSessions={maxSessions} onHover={setTooltip}/>
            {tooltip && (
              <div style={{
                position:"fixed", left:tooltip.x+12, top:tooltip.y-8,
                background:B.surfaceHigh, border:`1px solid ${B.borderLight}`,
                borderRadius:6, padding:"8px 12px", fontSize:11,
                fontFamily:"'Barlow',sans-serif", zIndex:999,
                pointerEvents:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.5)",
                minWidth:160,
              }}>
                <div style={{ fontWeight:700, color:B.textPrimary, marginBottom:5, fontSize:12 }}>{tooltip.country}</div>
                <div style={{ color:B.textSecond }}>Sessions: <strong style={{ color:B.raptorYellow }}>{(tooltip.sessions||0).toLocaleString()}</strong></div>
                <div style={{ color:B.textSecond }}>Users: <strong style={{ color:B.raptorYellow }}>{(tooltip.users||0).toLocaleString()}</strong></div>
                <div style={{ color:B.textSecond }}>Key Events: <strong style={{ color:B.raptorYellow }}>{(tooltip.conversions||0).toLocaleString()}</strong></div>
              </div>
            )}
            {/* Legend */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
              <span style={{ fontSize:9, color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif" }}>LOW</span>
              <div style={{ flex:1, maxWidth:120, height:6, borderRadius:3,
                background:`linear-gradient(to right, rgba(254,209,16,0.15), ${B.raptorYellow})` }}/>
              <span style={{ fontSize:9, color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif" }}>HIGH</span>
            </div>
          </div>

          {/* Country Table */}
          <div style={{ background:B.bg, borderRadius:6, border:`1px solid ${B.border}`, overflow:"hidden", marginBottom:14 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:B.surface }}>
                  <th style={{ ...thStyle, textAlign:"left", color:B.textMuted, width:32, padding:"9px 0 9px 14px" }}>#</th>
                  <th style={{ ...thStyle, textAlign:"left", color:B.textMuted }}>Country</th>
                  {['sessions','users','conversions'].map(k=>(
                    <th key={k} onClick={()=>k===sortKey?setSortDir(d=>d==="desc"?"asc":"desc"):(setSortKey(k),setSortDir("desc"))}
                      style={{ ...thStyle, textAlign:"right", color:sortKey===k?B.raptorYellow:B.textMuted }}>
                      {fmtLabel(k)}{sortKey===k?(sortDir==="desc"?" ↓":" ↑"):""}
                    </th>
                  ))}
                  <th style={{ ...thStyle, textAlign:"right", color:B.textMuted }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => {
                  const share = ((row.sessions / data.reduce((a,b)=>a+b.sessions,0))*100).toFixed(1);
                  return (
                    <tr key={row.countryCode} style={{ borderBottom:`1px solid ${B.border}` }}
                      onMouseEnter={e=>e.currentTarget.style.background=B.surface}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"10px 0 10px 14px", color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:600 }}>{i+1}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:Math.max(3, (row.sessions/maxSessions)*48), height:4,
                            borderRadius:2, background:B.raptorYellow, flexShrink:0 }}/>
                          <span style={{ color:B.textPrimary, fontWeight:500 }}>{row.country}</span>
                        </div>
                      </td>
                      <td style={{ padding:"10px 14px", textAlign:"right", fontFamily:"'Barlow Condensed',sans-serif", color:B.raptorYellow, fontWeight:600 }}>{row.sessions.toLocaleString()}</td>
                      <td style={{ padding:"10px 14px", textAlign:"right", fontFamily:"'Barlow Condensed',sans-serif", color:B.textSecond, fontWeight:600 }}>{row.users.toLocaleString()}</td>
                      <td style={{ padding:"10px 14px", textAlign:"right", fontFamily:"'Barlow Condensed',sans-serif", color:B.textSecond, fontWeight:600 }}>{row.conversions.toLocaleString()}</td>
                      <td style={{ padding:"10px 14px", textAlign:"right", fontFamily:"'Barlow Condensed',sans-serif", color:B.textMuted, fontSize:11 }}>{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

// ─── WORLD MAP using fetched SVG paths ────────────────────────────────────────
function MapSVG({ byCode, maxSessions, onHover }) {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    // Fetch world topojson and convert to SVG paths using d3
    Promise.all([
      import('https://cdn.jsdelivr.net/npm/d3-geo@3/+esm'),
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json()),
      import('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm'),
    ]).then(([d3geo, world, topojson]) => {
      const projection = d3geo.geoNaturalEarth1()
        .scale(153)
        .translate([480, 250]);
      const pathGen = d3geo.geoPath().projection(projection);
      const feats = topojson.feature(world, world.objects.countries).features;
      // Map numeric ID to ISO alpha-2 via a lookup table
      setCountries(feats.map(f => ({
        id: f.id,
        path: pathGen(f),
        name: NUMERIC_TO_NAME[f.id] || String(f.id),
        code: NUMERIC_TO_ALPHA2[f.id] || '',
      })).filter(c => c.path));
    }).catch(console.error);
  }, []);

  const getColor = (code) => {
    const d = byCode[code];
    if (!d || !code) return '#2A2A2A';
    const intensity = Math.max(0.15, d.sessions / maxSessions);
    return `rgba(254,209,16,${intensity})`;
  };

  return (
    <svg viewBox="0 0 960 500" style={{ width:'100%', height:'auto', display:'block' }}>
      <rect width="960" height="500" fill="#1A1A1A"/>
      {countries.map(c => (
        <path
          key={c.id}
          d={c.path}
          fill={getColor(c.code)}
          stroke="#383838"
          strokeWidth="0.5"
          style={{ cursor: byCode[c.code] ? 'pointer' : 'default', transition:'fill 0.1s' }}
          onMouseMove={e => byCode[c.code] && onHover({ x:e.clientX, y:e.clientY, country:c.name, ...byCode[c.code] })}
          onMouseLeave={() => onHover(null)}
          onMouseEnter={e => { if (byCode[c.code]) e.target.style.fill = 'rgba(254,209,16,0.9)'; }}
        />
      ))}
    </svg>
  );
}

// ISO numeric → alpha-2 lookup (major countries)
const NUMERIC_TO_ALPHA2 = {
  4:'AF',8:'AL',12:'DZ',24:'AO',32:'AR',36:'AU',40:'AT',50:'BD',56:'BE',
  64:'BT',68:'BO',76:'BR',100:'BG',104:'MM',116:'KH',120:'CM',124:'CA',
  144:'LK',152:'CL',156:'CN',170:'CO',180:'CD',188:'CR',191:'HR',192:'CU',
  196:'CY',203:'CZ',208:'DK',214:'DO',218:'EC',818:'EG',222:'SV',231:'ET',
  246:'FI',250:'FR',266:'GA',276:'DE',288:'GH',300:'GR',320:'GT',332:'HT',
  340:'HN',348:'HU',356:'IN',360:'ID',364:'IR',368:'IQ',372:'IE',376:'IL',
  380:'IT',388:'JM',392:'JP',400:'JO',398:'KZ',404:'KE',410:'KR',408:'KP',
  414:'KW',418:'LA',422:'LB',430:'LR',434:'LY',484:'MX',504:'MA',508:'MZ',
  516:'NA',524:'NP',528:'NL',554:'NZ',558:'NI',566:'NG',578:'NO',586:'PK',
  591:'PA',598:'PG',600:'PY',604:'PE',608:'PH',616:'PL',620:'PT',630:'PR',
  634:'QA',642:'RO',643:'RU',682:'SA',686:'SN',694:'SL',706:'SO',710:'ZA',
  724:'ES',729:'SD',752:'SE',756:'CH',760:'SY',158:'TW',762:'TJ',764:'TH',
  768:'TG',780:'TT',788:'TN',792:'TR',800:'UG',804:'UA',784:'AE',826:'GB',
  840:'US',858:'UY',860:'UZ',862:'VE',704:'VN',887:'YE',894:'ZM',716:'ZW',
  100:'BG',466:'ML',478:'MR',562:'NE',140:'CF',148:'TD',686:'SN',
};

const NUMERIC_TO_NAME = {
  4:'Afghanistan',8:'Albania',12:'Algeria',24:'Angola',32:'Argentina',
  36:'Australia',40:'Austria',50:'Bangladesh',56:'Belgium',68:'Bolivia',
  76:'Brazil',100:'Bulgaria',104:'Myanmar',116:'Cambodia',120:'Cameroon',
  124:'Canada',144:'Sri Lanka',152:'Chile',156:'China',170:'Colombia',
  180:'DR Congo',188:'Costa Rica',191:'Croatia',192:'Cuba',196:'Cyprus',
  203:'Czech Republic',208:'Denmark',214:'Dominican Republic',218:'Ecuador',
  818:'Egypt',222:'El Salvador',231:'Ethiopia',246:'Finland',250:'France',
  276:'Germany',288:'Ghana',300:'Greece',320:'Guatemala',332:'Haiti',
  340:'Honduras',348:'Hungary',356:'India',360:'Indonesia',364:'Iran',
  368:'Iraq',372:'Ireland',376:'Israel',380:'Italy',388:'Jamaica',
  392:'Japan',400:'Jordan',398:'Kazakhstan',404:'Kenya',410:'South Korea',
  408:'North Korea',414:'Kuwait',418:'Laos',422:'Lebanon',434:'Libya',
  484:'Mexico',504:'Morocco',508:'Mozambique',524:'Nepal',528:'Netherlands',
  554:'New Zealand',558:'Nicaragua',566:'Nigeria',578:'Norway',586:'Pakistan',
  591:'Panama',600:'Paraguay',604:'Peru',608:'Philippines',616:'Poland',
  620:'Portugal',642:'Romania',643:'Russia',682:'Saudi Arabia',710:'South Africa',
  724:'Spain',729:'Sudan',752:'Sweden',756:'Switzerland',760:'Syria',
  764:'Thailand',792:'Turkey',800:'Uganda',804:'Ukraine',784:'UAE',
  826:'United Kingdom',840:'United States',858:'Uruguay',862:'Venezuela',
  704:'Vietnam',887:'Yemen',894:'Zambia',716:'Zimbabwe',
};

// ─── GA4 LIVE DATA HOOK ───────────────────────────────────────────────────────
const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8080'
  : '';

function useGA4Data() {
  const { startDate, endDate } = useDash();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/ga4?start=${startDate}&end=${endDate}`)
      .then(r => r.json())
      .then(rows => {
        const channels = {};
        rows.forEach(row => {
          if (!channels[row.channel]) channels[row.channel] = [];
          channels[row.channel].push({
            date:        `${row.date.slice(4,6)}/${row.date.slice(6,8)}`,
            sessions:    row.sessions,
            users:       row.users,
            pageviews:   row.pageviews,
            conversions: row.conversions,
            avgDuration: row.avgDuration,
          });
        });
        // Sort each channel's data by date
        Object.values(channels).forEach(arr => arr.sort((a,b) => a.date.localeCompare(b.date)));
        setData(channels);
        setLoading(false);
      })
      .catch(err => { console.error('GA4 fetch error:', err); setLoading(false); });
  }, [startDate, endDate]);

  return { data, loading };
}

// ─── GOOGLE TAB — sub-nav ─────────────────────────────────────────────────────
const GOOGLE_SUBS = [
  { id:"googlePaid",    label:"Paid Search",  accent:B.hartyGreen  },
  { id:"googleOrganic", label:"Organic",      accent:"#6BA82E"     },
  { id:"analytics",     label:"Analytics",    accent:B.raptorYellow },
];

function GoogleTab() {
  const [sub, setSub] = useState("googlePaid");
  const { data: ga4Data, loading } = useGA4Data();
  const bp = useBreakpoint();

  const channelMap = {
    "Paid Search":      { id:"ga1",  name:"Paid Search",      color:"#FED110" },
    "Organic Search":   { id:"ga2",  name:"Organic Search",   color:"#D4AE0E" },
    "Paid Social":      { id:"ga3",  name:"Paid Social",      color:"#A88A0B" },
    "Organic Social":   { id:"ga5",  name:"Organic Social",   color:"#8A6E08" },
    "Direct":           { id:"ga4d", name:"Direct",           color:"#7A6408" },
    "Email":            { id:"ga6",  name:"Email",            color:"#6A5A08" },
    "Referral":         { id:"ga7",  name:"Referral",         color:"#5A9028" },
    "Affiliates":       { id:"ga8",  name:"Affiliates",       color:"#4A7820" },
    "Display":          { id:"ga9",  name:"Display",          color:"#3A6018" },
    "Paid Video":       { id:"ga10", name:"Paid Video",       color:"#2A4810" },
    "Organic Video":    { id:"ga11", name:"Organic Video",    color:"#1A3008" },
    "Unassigned":       { id:"ga12", name:"Unassigned",       color:"#484848" },
    "(Other)":          { id:"ga13", name:"Other",            color:"#383838" },
  };

  const liveGA4Campaigns = useMemo(() => {
    if (!ga4Data) return CAMPAIGNS.ga4;
    const seen = new Set();
    return Object.entries(ga4Data)
      .map(([channel, rows]) => {
        const meta = channelMap[channel] || { id: channel, name: channel, color: B.hartyGreen };
        if (seen.has(meta.id)) return null;
        seen.add(meta.id);
        return { ...meta, data: rows };
      })
      .filter(Boolean);
  }, [ga4Data]);

  return (
    <>
      {/* Sub-nav */}
      <div style={{ display:"flex", gap:0, marginBottom:24, borderBottom:`1px solid ${B.border}` }}>
        {GOOGLE_SUBS.map(s=>(
          <button key={s.id} onClick={()=>setSub(s.id)} style={{ padding:bp.isMobile?"8px 14px":"10px 20px", border:"none", cursor:"pointer", background:"transparent", fontSize:bp.isMobile?11:12, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"0.08em", color:sub===s.id?s.accent:B.textMuted, borderBottom:sub===s.id?`2px solid ${s.accent}`:"2px solid transparent", marginBottom:-1, whiteSpace:"nowrap", transition:"all 0.15s", textTransform:"uppercase" }}>
            {s.label}
          </button>
        ))}
      </div>

      {sub === "googlePaid"    && <Section {...SECTIONS.googlePaid}/>}
      {sub === "googleOrganic" && <Section {...SECTIONS.googleOrganic}/>}
      {sub === "analytics" && (
        <>
          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0", color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, letterSpacing:"0.1em" }}>
              <div style={{ width:14, height:14, border:`2px solid ${B.hartyGreen}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
              LOADING ANALYTICS DATA…
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {!loading && (
            <LiveSection campaigns={liveGA4Campaigns} {...SECTIONS.analytics}/>
          )}
          <CountrySection/>
          <div style={{ height:1, background:B.border, margin:"32px 0 28px" }}/>
          <SearchTermsSection/>
        </>
      )}
    </>
  );
}

// ─── TOP-LEVEL NAV ────────────────────────────────────────────────────────────
const NAV = [
  { id:"google", label:"Google",  accent:B.hartyGreen },
  { id:"meta",   label:"Meta",    accent:"#95C93D"    },
];

// ─── DATE RANGE CONTROL ───────────────────────────────────────────────────────
const PRESETS = [
  { label:"7D",  days:7  },
  { label:"30D", days:30 },
  { label:"90D", days:90 },
  { label:"12M", days:365 },
];

function DateRangeControl({ startDate, endDate, onChange }) {
  const bp = useBreakpoint();
  const [showCustom, setShowCustom] = useState(false);

  // Detect if current range matches a preset
  const n = diffDays(startDate, endDate) + 1;
  const activePreset = PRESETS.find(p => p.days === n) || null;

  const applyPreset = (days) => {
    const end   = new Date(); end.setDate(end.getDate() - 1);
    const start = new Date(); start.setDate(start.getDate() - days);
    onChange(toISO(start), toISO(end));
    setShowCustom(false);
  };

  const inputStyle = {
    background:"transparent", border:`1px solid ${B.border}`, borderRadius:3,
    color:B.textPrimary, fontSize:10, fontFamily:"'Barlow Condensed',sans-serif",
    fontWeight:600, padding:"4px 8px", cursor:"pointer",
    colorScheme:"dark", letterSpacing:"0.04em",
  };

  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
      {/* Preset buttons */}
      <div style={{ display:"flex", gap:2, background:B.surface, padding:3, borderRadius:4, border:`1px solid ${B.border}` }}>
        {PRESETS.map(p=>(
          <button key={p.label} onClick={()=>applyPreset(p.days)} style={{
            padding:bp.isMobile?"4px 8px":"5px 12px", borderRadius:3, border:"none", cursor:"pointer",
            fontSize:bp.isMobile?10:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif",
            letterSpacing:"0.08em",
            background: activePreset?.days===p.days && !showCustom ? B.hartyGreen : "transparent",
            color:       activePreset?.days===p.days && !showCustom ? B.deepBlack : B.textMuted,
            transition:"all 0.15s",
          }}>{p.label}</button>
        ))}
        {/* Custom toggle button */}
        <button onClick={()=>setShowCustom(v=>!v)} style={{
          padding:bp.isMobile?"4px 8px":"5px 12px", borderRadius:3, border:"none", cursor:"pointer",
          fontSize:bp.isMobile?10:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif",
          letterSpacing:"0.08em",
          background: showCustom ? B.hartyGreen : "transparent",
          color:       showCustom ? B.deepBlack : B.textMuted,
          transition:"all 0.15s",
        }}>CUSTOM</button>
      </div>

      {/* Custom date inputs — shown inline when toggled */}
      {showCustom && (
        <div style={{ display:"flex", alignItems:"center", gap:6, background:B.surface, padding:"3px 10px", borderRadius:4, border:`1px solid ${B.hartyGreen}44` }}>
          <span style={{ fontSize:9, color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"0.1em" }}>FROM</span>
          <input type="date" value={startDate} max={endDate}
            onChange={e=>onChange(e.target.value, endDate)} style={inputStyle}/>
          <span style={{ fontSize:9, color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"0.1em" }}>TO</span>
          <input type="date" value={endDate} min={startDate} max={toISO(new Date())}
            onChange={e=>onChange(startDate, e.target.value)} style={inputStyle}/>
        </div>
      )}
    </div>
  );
}

// ─── META DATA HOOK ───────────────────────────────────────────────────────────
function useMetaData() {
  const { startDate, endDate } = useDash();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/meta?start=${startDate}&end=${endDate}`)
      .then(r => r.json())
      .then(rows => {
        console.log('Meta rows:', rows);
        if (!Array.isArray(rows)) { console.log('Not array:', rows); setLoading(false); return; }

        // ── Merge all platforms into single campaign+date rows (for charts) ──
        const merged = {};
        rows.forEach(row => {
          const key = `${row.campaign}||${row.date}`;
          if (!merged[key]) merged[key] = {
            date:row.date, campaign:row.campaign,
            impressions:0, reach:0, spend:0,
            linkClicks:0, shares:0, comments:0, saves:0, reactions:0, leads:0,
          };
          const m = merged[key];
          m.impressions += row.impressions; m.reach      += row.reach;
          m.spend       += row.spend;       m.linkClicks += row.linkClicks;
          m.shares      += row.shares;      m.comments   += row.comments;
          m.saves       += row.saves;       m.reactions  += row.reactions;
          m.leads       += row.leads;
        });

        // ── Group merged rows by campaign ──
        const byCampaign = {};
        Object.values(merged).forEach(row => {
          if (!byCampaign[row.campaign]) byCampaign[row.campaign] = [];
          byCampaign[row.campaign].push({
            date:`${row.date.slice(5,7)}/${row.date.slice(8,10)}`,
            isoDate: row.date,
            impressions:row.impressions, reach:row.reach,
            spend:Math.round(row.spend*100)/100,
            linkClicks:row.linkClicks, shares:row.shares,
            comments:row.comments, saves:row.saves,
            reactions:row.reactions, leads:row.leads,
          });
        });
        Object.values(byCampaign).forEach(arr => arr.sort((a,b)=>a.date.localeCompare(b.date)));

        const colors = ['#6BA82E','#5A9028','#48782C','#366820','#245814','#7E9A50'];
        let campaignList = Object.entries(byCampaign).map(([name,data],i) => ({
          id:`meta_${i}`, color:colors[i%colors.length],
          name:name.length>32?name.slice(0,32)+'…':name, data,
        }));

        // If no campaigns returned at all, nothing to show
        if (!campaignList.length) {
          setData({ campaigns: [], byPlatform: [] });
          setLoading(false);
          return;
        }
        // ── Platform breakdown totals (for breakdown table) ──
        const byPlatform = {};
        rows.forEach(row => {
          const p = row.platform || 'facebook';
          if (!byPlatform[p]) byPlatform[p] = {
            platform:p, impressions:0, reach:0, spend:0,
            linkClicks:0, reactions:0, comments:0, shares:0, saves:0, leads:0,
          };
          const m = byPlatform[p];
          m.impressions+=row.impressions; m.reach+=row.reach;
          m.spend+=row.spend;             m.linkClicks+=row.linkClicks;
          m.reactions+=row.reactions;     m.comments+=row.comments;
          m.shares+=row.shares;           m.saves+=row.saves;
          m.leads+=row.leads;
        });
        Object.values(byPlatform).forEach(p => { p.spend = Math.round(p.spend*100)/100; });

        setData({ campaigns: campaignList, byPlatform: Object.values(byPlatform) });
        setLoading(false);
      })
      .catch(err => { console.error('Meta fetch error:', err); setLoading(false); });
  }, [startDate, endDate]);

  return { data, loading };
}

// ─── PAGE INSIGHTS HOOK ──────────────────────────────────────────────────────
function usePageData() {
  const { startDate, endDate } = useDash();
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/meta-page?start=${startDate}&end=${endDate}`)
      .then(r => r.json())
      .then(rows => { setData(Array.isArray(rows) ? rows : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [startDate, endDate]);

  return { data, loading };
}

// ─── META SECTION CONFIGS ─────────────────────────────────────────────────────
const META_PAID_CONFIG = {
  title:      "Facebook — Paid",
  accent:     "#95C93D",
  metricKeys: ["impressions","reach","spend","linkClicks","leads"],
  tableFmt:   (k,v) => k==="spend" ? `$${v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : v.toLocaleString(),
  charts: [
    { type:"area-pair", items:[
      { title:"Impressions over Time", dataKey:"impressions" },
      { title:"Reach over Time",       dataKey:"reach"       },
    ]},
    { type:"area-pair", items:[
      { title:"Spend over Time",       dataKey:"spend",      fmtVal:(_,v)=>`$${fmtD(v)}` },
      { title:"Link Clicks over Time", dataKey:"linkClicks"  },
    ]},
    { type:"bar", title:"Spend by Campaign",       dataKey:"spend",      fmtVal:(_,v)=>`$${fmtD(v)}` },
    { type:"bar", title:"Link Clicks by Campaign", dataKey:"linkClicks"  },
    { type:"bar", title:"Leads by Campaign",       dataKey:"leads", height:140 },
  ],
};

const META_TOTAL_CONFIG = {
  title:      "Facebook — Total (Paid + Organic)",
  accent:     "#6BA82E",
  metricKeys: ["impressions","reach","spend","linkClicks","reactions","comments","shares","saves","leads"],
  tableFmt:   (k,v) => k==="spend" ? `$${v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : v.toLocaleString(),
  charts: [
    { type:"area-pair", items:[
      { title:"Impressions over Time", dataKey:"impressions" },
      { title:"Reach over Time",       dataKey:"reach"       },
    ]},
    { type:"area-pair", items:[
      { title:"Spend over Time",       dataKey:"spend",      fmtVal:(_,v)=>`$${fmtD(v)}` },
      { title:"Link Clicks over Time", dataKey:"linkClicks"  },
    ]},
    { type:"area-quad", items:[
      { title:"Reactions over Time",   dataKey:"reactions"   },
      { title:"Comments over Time",    dataKey:"comments"    },
      { title:"Shares over Time",      dataKey:"shares"      },
      { title:"Saves over Time",       dataKey:"saves"       },
    ]},
    { type:"bar", title:"Link Clicks by Campaign",  dataKey:"linkClicks"  },
    { type:"bar", title:"Leads by Campaign",        dataKey:"leads", height:140 },
  ],
};

// ─── ORGANIC FACEBOOK SECTION ─────────────────────────────────────────────────
// Page Insights returns aggregate daily data (not per-campaign), so we render
// it as a single "Page" series using a bespoke component.
function OrganicFacebookSection() {
  const { data, loading } = usePageData();
  const { compareMode }   = useDash();
  const bp = useBreakpoint();
  const accent = B.spyderGreen;

  const metricKeys = ["reach","engagements"];

  const totals = data.reduce((acc, row) => {
    metricKeys.forEach(k => { acc[k] = (acc[k]||0) + (row[k]||0); });
    return acc;
  }, {});

  const pageCampaign = [{
    id: "fb_page",
    name: "Facebook Page",
    color: accent,
    data: data.map(r => ({
      date:        `${r.date.slice(5,7)}/${r.date.slice(8,10)}`,
      isoDate:     r.date,
      reach:       r.reach,
      engagements: r.engagements,
    })),
  }];

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0",
      color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, letterSpacing:"0.1em" }}>
      <div style={{ width:14, height:14, border:`2px solid ${accent}`,
        borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      LOADING PAGE INSIGHTS…
    </div>
  );

  const ORGANIC_LABEL = { reach:"Reach", engagements:"Engagements" };

  return (
    <>
      <div style={{ display:"flex", gap:bp.isMobile?6:10, flexWrap:"wrap", marginBottom:4 }}>
        {metricKeys.map(k => (
          <div key={k} style={{ background:B.surface, borderRadius:6, padding:"10px 14px",
            border:`1px solid ${B.border}`, flex:"1 1 110px", borderTop:`3px solid ${accent}` }}>
            <div style={{ fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", color:B.textMuted,
              textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:5, fontWeight:600 }}>
              {ORGANIC_LABEL[k]}
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:accent,
              fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"-0.01em" }}>
              {fmtK(totals[k]||0)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── PLATFORM BREAKDOWN TABLE ────────────────────────────────────────────────
function PlatformBreakdownTable({ byPlatform }) {
  const keys = ["impressions","reach","spend","linkClicks","reactions","comments","shares","saves","leads"];
  const PLATFORM_LABEL = { facebook:"Facebook", instagram:"Instagram", threads:"Threads", messenger:"Messenger" };
  const thStyle = {
    padding:"9px 14px", fontSize:9, fontFamily:"'Barlow Condensed',sans-serif",
    textTransform:"uppercase", letterSpacing:"0.12em",
    borderBottom:`1px solid ${B.border}`, fontWeight:600,
    color:B.textMuted, whiteSpace:"nowrap",
  };
  if (!byPlatform?.length) return null;
  return (
    <div style={{ marginTop:24 }}>
      <div style={{ fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700,
        color:B.textSecond, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
        Breakdown by Platform
      </div>
      <div style={{ background:B.bg, borderRadius:6, border:`1px solid ${B.border}`, overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:B.surface }}>
              <th style={{ ...thStyle, textAlign:"left" }}>Platform</th>
              {keys.map(k => <th key={k} style={{ ...thStyle, textAlign:"right" }}>{fmtLabel(k)}</th>)}
            </tr>
          </thead>
          <tbody>
            {byPlatform.map(row => (
              <tr key={row.platform} style={{ borderBottom:`1px solid ${B.border}` }}
                onMouseEnter={e=>e.currentTarget.style.background=B.surface}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"10px 14px", fontWeight:600, color:B.textPrimary,
                  fontFamily:"'Barlow Condensed',sans-serif", textTransform:"capitalize" }}>
                  {PLATFORM_LABEL[row.platform] || row.platform}
                </td>
                {keys.map(k => (
                  <td key={k} style={{ padding:"10px 14px", textAlign:"right",
                    fontFamily:"'Barlow Condensed',sans-serif",
                    color: k==="spend" ? B.raptorYellow : B.textSecond, fontWeight:600 }}>
                    {k==="spend"
                      ? `$${row[k].toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`
                      : (row[k]||0).toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── INSTAGRAM INSIGHTS HOOK ─────────────────────────────────────────────────
function useInstagramData() {
  const { startDate, endDate } = useDash();
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/meta-instagram?start=${startDate}&end=${endDate}`)
      .then(r => r.json())
      .then(rows => { setData(Array.isArray(rows) ? rows : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [startDate, endDate]);

  return { data, loading };
}

// ─── INSTAGRAM ORGANIC SECTION ────────────────────────────────────────────────
function InstagramOrganicSection() {
  const { data, loading } = useInstagramData();
  const bp  = useBreakpoint();
  const accent = B.spyderGreen;
  const metricKeys = ["reach","engaged","interactions","profileViews","newFollowers"];
  const IG_LABELS  = { reach:"Reach", engaged:"Accounts Engaged", interactions:"Total Interactions", profileViews:"Profile Views", newFollowers:"New Followers" };

  const totals = data.reduce((acc, row) => {
    metricKeys.forEach(k => { acc[k] = (acc[k]||0) + (row[k]||0); });
    return acc;
  }, {});

  const igCampaign = [{
    id:"ig_page", name:"Instagram Account", color:accent,
    data: data.map(r => ({
      date:         `${r.date.slice(5,7)}/${r.date.slice(8,10)}`,
      isoDate:      r.date,
      reach:        r.reach,
      profileViews: r.profileViews,
      newFollowers: r.newFollowers,
      engaged:      r.engaged,
      interactions: r.interactions,
    })),
  }];

  const thStyle = { padding:"9px 14px", fontSize:9, fontFamily:"'Barlow Condensed',sans-serif",
    textTransform:"uppercase", letterSpacing:"0.12em", borderBottom:`1px solid ${B.border}`,
    fontWeight:600, color:B.textMuted, whiteSpace:"nowrap" };

  if (loading) return <Spinner accent={accent} label="INSTAGRAM"/>;

  return (
    <>
      <div style={{ display:"flex", gap:bp.isMobile?6:10, flexWrap:"wrap", marginBottom:16 }}>
        {metricKeys.map(k => (
          <div key={k} style={{ background:B.surface, borderRadius:6, padding:"10px 14px",
            border:`1px solid ${B.border}`, flex:"1 1 110px", borderTop:`3px solid ${accent}` }}>
            <div style={{ fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", color:B.textMuted,
              textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:5, fontWeight:600 }}>
              {IG_LABELS[k]}
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:accent,
              fontFamily:"'Barlow Condensed',sans-serif" }}>{fmtK(totals[k]||0)}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:bp.isMobile?"1fr":"1fr 1fr", gap:14, marginBottom:0 }}>
        <ChartCard title="Reach over Time" accent={accent}>
          <CampaignAreaChart campaigns={igCampaign} dataKey="reach" height={160}/>
        </ChartCard>
        <ChartCard title="New Followers over Time" accent={accent}>
          <CampaignAreaChart campaigns={igCampaign} dataKey="newFollowers" height={160}/>
        </ChartCard>
      </div>
    </>
  );
}

// ─── META TAB (PAID) ──────────────────────────────────────────────────────────
// ─── META TAB (PAID + FACEBOOK + INSTAGRAM) ──────────────────────────────────
function MetaTab() {
  const bp = useBreakpoint();
  const sectionHeader = (label, accent) => (
    <div style={{
      display:"flex", alignItems:"center", gap:12, margin:"28px 0 16px",
    }}>
      <div style={{ width:4, height:22, borderRadius:2, background:accent, flexShrink:0 }}/>
      <div style={{ fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700,
        letterSpacing:"0.15em", textTransform:"uppercase", color:accent }}>
        {label}
      </div>
      <div style={{ flex:1, height:1, background:accent, opacity:0.2 }}/>
    </div>
  );
  return (
    <div>
      <MetaPaidTab/>
      {sectionHeader("Instagram — Organic", B.spyderGreen)}
      <InstagramOrganicSection/>
    </div>
  );
}

// ─── META PAID TAB ────────────────────────────────────────────────────────────
function MetaPaidTab() {
  const { data, loading } = useMetaData();
  const accent = "#95C93D";
  const campaigns = data?.campaigns;

  if (loading || data === null) return <Spinner accent={accent} label="META PAID"/>;
  if (!campaigns?.length) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"60px 20px", color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:13, letterSpacing:"0.1em", textTransform:"uppercase", gap:12 }}>
      <div style={{ fontSize:28, opacity:0.3 }}>◈</div>
      <div>No paid campaign data found</div>
    </div>
  );

  return (
    <>
      <LiveSection campaigns={campaigns} {...META_PAID_CONFIG}/>
      <PlatformBreakdownTable byPlatform={data?.byPlatform}/>
    </>
  );
}

function Spinner({ accent, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0",
      color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, letterSpacing:"0.1em" }}>
      <div style={{ width:14, height:14, border:`2px solid ${accent}`,
        borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      LOADING {label} DATA…
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { start, end } = defaultDates();
  const [startDate, setStartDate]     = useState(start);
  const [endDate,   setEndDate]       = useState(end);
  const [compareMode, setCompareMode] = useState("none");
  const [activeTab, setActiveTab] = useState("google");
  const bp = useBreakpoint();

  const handleDateChange = (s, e) => { setStartDate(s); setEndDate(e); };

  return (
    <DashContext.Provider value={{ startDate, endDate, compareMode }}>
      <div style={{ minHeight:"100vh", background:B.bg, fontFamily:"'Barlow',sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; }
          ::-webkit-scrollbar { height:4px; width:4px; }
          ::-webkit-scrollbar-track { background:${B.bg}; }
          ::-webkit-scrollbar-thumb { background:${B.borderLight}; border-radius:2px; }
          input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor:pointer; }
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{ background:B.deepBlack, borderBottom:`2px solid ${B.hartyGreen}`, position:"sticky", top:0, zIndex:100 }}>
          <div style={{ padding:bp.isMobile?"0 14px":"0 28px" }}>
            {/* Row 1: wordmark + controls */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:bp.isMobile?"10px 0 8px":"14px 0 12px", borderBottom:`1px solid ${B.border}`, flexWrap:"wrap", gap:8 }}>

              {/* Wordmark */}
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="3" fill={B.hartyGreen}/>
                  <path d="M6 7h3v5.5l5-5.5h4l-5.5 6 6 8h-4l-4.5-6.5V21H6V7z" fill={B.deepBlack}/>
                  <rect x="16" y="12" width="6" height="2" rx="1" fill={B.deepBlack}/>
                </svg>
                <div>
                  <div style={{ fontSize:bp.isMobile?13:15, fontWeight:700, color:B.textPrimary, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.06em", lineHeight:1.1 }}>K-HART INDUSTRIES</div>
                  <div style={{ fontSize:8, color:B.hartyGreen, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.18em", fontWeight:600 }}>MARKETING DASHBOARD</div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <DateRangeControl startDate={startDate} endDate={endDate} onChange={handleDateChange}/>
                {!bp.isMobile && <div style={{ width:1, height:20, background:B.border }}/>}
                <CompareDropdown value={compareMode} onChange={setCompareMode} compact={bp.isMobile}/>
              </div>
            </div>

            {/* Row 2: nav tabs */}
            <div style={{ display:"flex", overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
              {NAV.map(item=>(
                <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{ padding:bp.isMobile?"10px 14px":"12px 22px", border:"none", cursor:"pointer", background:"transparent", fontSize:bp.isMobile?11:12, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"0.1em", color:activeTab===item.id?item.accent:B.textMuted, borderBottom:activeTab===item.id?`2px solid ${item.accent}`:"2px solid transparent", marginBottom:-2, whiteSpace:"nowrap", transition:"all 0.15s", textTransform:"uppercase" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding:bp.isMobile?"16px 14px":"28px 28px" }}>

          {/* Date range label */}
          <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.1em", fontWeight:600 }}>
              {fmtDisplay(startDate)} — {fmtDisplay(endDate)}
            </span>
            <span style={{ fontSize:10, color:B.textMuted, fontFamily:"'Barlow Condensed',sans-serif" }}>
              ({diffDays(startDate, endDate) + 1} days)
            </span>
          </div>

          {/* Summary bar */}
          <div style={{ display:"grid", gridTemplateColumns:bp.isMobile?"1fr 1fr":bp.isTablet?"repeat(3,1fr)":"repeat(5,1fr)", gap:bp.isMobile?8:12, marginBottom:bp.isMobile?20:28 }}>
            {[
              { label:"Total Spend",       value:"$18,260", color:B.hartyGreen  },
              { label:"Total Impressions", value:"2.95M",   color:"#6BA82E"     },
              { label:"Total Conversions", value:"1,893",   color:B.raptorYellow},
              { label:"Blended ROAS",      value:"5.4×",    color:B.hartyGreen  },
              { label:"Organic Sessions",  value:"17.6K",   color:B.spyderGreen },
            ].map(s=>(
              <div key={s.label} style={{ background:B.surface, borderRadius:6, padding:bp.isMobile?"10px 12px":"14px 18px", border:`1px solid ${B.border}`, borderTop:`3px solid ${s.color}` }}>
                <div style={{ fontSize:8, fontFamily:"'Barlow Condensed',sans-serif", color:B.textMuted, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:5, fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:bp.isMobile?17:22, fontWeight:700, color:s.color, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"-0.01em" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "google" && <GoogleTab/>}
          {activeTab === "meta"   && <MetaTab/>}
        </div>
      </div>
    </DashContext.Provider>
  );
}
