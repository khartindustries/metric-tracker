import { useState, useMemo, createContext, useContext, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
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
  const today = new Date(2026, 2, 3);
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
    { id:"ga1",  name:"Paid Search",               color:"#FED110", seeds:{ sessions:1800, users:1300, pageviews:5200, conversions:28, revenue:1400 }, seedBase:154 },
    { id:"ga2",  name:"Organic Search",            color:"#D4AE0E", seeds:{ sessions:1200, users:900,  pageviews:3600, conversions:18, revenue:900  }, seedBase:165 },
    { id:"ga3",  name:"Paid Social",               color:"#A88A0B", seeds:{ sessions:800,  users:620,  pageviews:2200, conversions:11, revenue:560  }, seedBase:176 },
    { id:"ga4d", name:"Direct / Email",            color:"#7A6408", seeds:{ sessions:480,  users:370,  pageviews:1400, conversions:8,  revenue:380  }, seedBase:187 },
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
const fmtD = v => `$${fmtK(v)}`;
const RANGE_OPTS = ["7d","30d","90d"];
const COMPARE_OPTS = [
  { value:"none",  label:"No comparison"    },
  { value:"prev",  label:"Previous period"  },
  { value:"mom",   label:"Month over month" },
  { value:"yoy",   label:"Year over year"   },
];

function rangeN(r) { return r==="7d"?7:r==="30d"?30:90; }
function slicePeriods(data, range, compareMode) {
  const n = rangeN(range);
  const curr = data.slice(-n);
  let prev = null;
  if (compareMode==="prev") prev = data.slice(-n*2,-n);
  else if (compareMode==="mom") prev = data.slice(-(n+30),-30).slice(-n);
  else if (compareMode==="yoy") prev = data.slice(0,n);
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

function StatCard({ label, curr, prev, color, fmt=fmtK, inverted=false }) {
  const delta = prev!=null ? pctDelta(curr,prev) : null;
  return (
    <div style={{ background:B.surface, borderRadius:6, padding:"10px 14px", border:`1px solid ${B.border}`, flex:"1 1 110px", borderTop:`3px solid ${color||B.hartyGreen}` }}>
      <div style={{ fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", color:B.textMuted, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:5, fontWeight:600 }}>{label}</div>
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
  const { range, compareMode } = useDash();
  const n = rangeN(range);
  const comparing = compareMode && compareMode !== "none";
  const data = useMemo(() => {
    if (!campaigns.length) return [];
    const base = Object.values(CAMPAIGNS).flat()[0].data.slice(-n);
    return base.map((row,i) => {
      const pt = { date: row.date };
      campaigns.forEach(c => {
        pt[`curr_${c.id}`] = c.data.slice(-n)[i]?.[dataKey]??0;
        if (comparing) { const {prev}=slicePeriods(c.data,range,compareMode); pt[`prev_${c.id}`]=prev?.[i]?.[dataKey]??0; }
      });
      return pt;
    });
  }, [campaigns, range, compareMode, dataKey, n]);

  if (!campaigns.length) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:B.textMuted, fontSize:11, fontFamily:"'Barlow',sans-serif" }}>No campaigns selected</div>;

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
          <Area key={`c_${c.id}`} type="monotone" dataKey={`curr_${c.id}`} name={c.name} stroke={c.color} fill={`url(#ag_${c.id})`} strokeWidth={2} dot={false}/>,
          comparing && <Line key={`p_${c.id}`} type="monotone" dataKey={`prev_${c.id}`} name={`${c.name} (prev)`} stroke={c.color} strokeDasharray="4 3" strokeWidth={1.5} dot={false} strokeOpacity={0.4}/>
        ])}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CampaignBarChart({ campaigns, dataKey, height=160, fmtVal }) {
  const { range, compareMode } = useDash();
  const comparing = compareMode && compareMode !== "none";
  const data = useMemo(() => campaigns.map(c => {
    const { curr, prev } = slicePeriods(c.data, range, compareMode);
    return { name:c.name.length>22?c.name.slice(0,22)+"…":c.name, curr:curr.reduce((a,b)=>a+(b[dataKey]||0),0), prev:prev?prev.reduce((a,b)=>a+(b[dataKey]||0),0):null, color:c.color };
  }), [campaigns, range, compareMode, dataKey]);

  if (!campaigns.length) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:B.textMuted, fontSize:11, fontFamily:"'Barlow',sans-serif" }}>No campaigns selected</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left:0, right:24 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke={B.border} horizontal={false}/>
        <XAxis type="number" tick={{ fill:B.textMuted, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} axisLine={false} tickFormatter={fmtK}/>
        <YAxis type="category" dataKey="name" tick={{ fill:B.textSecond, fontSize:9, fontFamily:"'Barlow',sans-serif" }} tickLine={false} axisLine={false} width={155}/>
        <Tooltip content={<ChartTooltip fmtVal={fmtVal}/>}/>
        {comparing && <Legend wrapperStyle={{ fontSize:9, fontFamily:"'Barlow',sans-serif", color:B.textSecond }}/>}
        <Bar dataKey="curr" name="Current" radius={[0,3,3,0]} opacity={0.9}>
          {data.map((e,i)=><Cell key={i} fill={e.color}/>)}
        </Bar>
        {comparing && <Bar dataKey="prev" name="Prev. period" fill={B.borderLight} radius={[0,3,3,0]} opacity={0.5}/>}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── CAMPAIGN TABLE ──────────────────────────────────────────────────────────
function CampaignTable({ allCampaigns, hidden, toggle, toggleAll, metricKeys, fmtCell }) {
  const { range, compareMode } = useDash();
  const [sortKey, setSortKey] = useState(metricKeys[0]);
  const [sortDir, setSortDir] = useState("desc");
  const comparing = compareMode && compareMode !== "none";
  const rows = allCampaigns.map(c => {
    const { curr, prev } = slicePeriods(c.data, range, compareMode);
    return { ...c, currSum:sumKeys(curr,metricKeys), prevSum:prev?sumKeys(prev,metricKeys):null };
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
            <th style={{ ...thStyle, textAlign:"left", color:B.textMuted }}>Campaign</th>
            {metricKeys.map(k=>(
              <th key={k} onClick={()=>k===sortKey?setSortDir(d=>d==="desc"?"asc":"desc"):(setSortKey(k),setSortDir("desc"))}
                style={{ ...thStyle, textAlign:"right", color:sortKey===k?B.hartyGreen:B.textMuted, cursor:"pointer", userSelect:"none", whiteSpace:"nowrap" }}>
                {k}{sortKey===k?(sortDir==="desc"?" ↓":" ↑"):""}
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

// ─── SECTION BUILDER ─────────────────────────────────────────────────────────
function Section({ campaignKey, title, accent, metricKeys, charts, tableFmt }) {
  const { range, compareMode } = useDash();
  const bp = useBreakpoint();
  const allCampaigns = CAMPAIGNS[campaignKey];
  const { hidden, toggle, toggleAll, visible } = useCampaignVisibility(allCampaigns);
  const allCurr = allCampaigns.flatMap(c=>slicePeriods(c.data,range,compareMode).curr);
  const allPrev = compareMode&&compareMode!=="none" ? allCampaigns.flatMap(c=>slicePeriods(c.data,range,compareMode).prev||[]) : null;
  const tc = sumKeys(allCurr,metricKeys);
  const tp = allPrev ? sumKeys(allPrev,metricKeys) : {};

  return (
    <>
      <SectionHeader title={title} accent={accent}/>
      <CompareLabel compareMode={compareMode}/>
      <div style={{ display:"flex", gap:bp.isMobile?6:10, flexWrap:"wrap", marginBottom:16 }}>
        {metricKeys.map(k=>(<StatCard key={k} label={k} curr={tc[k]} prev={tp[k]} color={accent} fmt={k==="spend"||k==="revenue"?fmtD:fmtK}/>))}
      </div>
      <CampaignFilterBar campaigns={allCampaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll}/>
      {charts.map((chart,ci)=>{
        if (chart.type==="area") return <ChartCard key={ci} title={chart.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={chart.dataKey} height={bp.isMobile?150:chart.height||200} fmtVal={chart.fmtVal}/></ChartCard>;
        if (chart.type==="area-pair") return (
          <div key={ci} style={{ display:"grid", gridTemplateColumns:bp.isMobile?"1fr":"1fr 1fr", gap:14 }}>
            {chart.items.map((item,ii)=>(<ChartCard key={ii} title={item.title} accent={accent}><CampaignAreaChart campaigns={visible} dataKey={item.dataKey} height={bp.isMobile?140:160} fmtVal={item.fmtVal}/></ChartCard>))}
          </div>
        );
        if (chart.type==="bar") return <ChartCard key={ci} title={chart.title} accent={accent}><CampaignBarChart campaigns={visible} dataKey={chart.dataKey} height={chart.height||160} fmtVal={chart.fmtVal}/></ChartCard>;
        return null;
      })}
      <CampaignTable allCampaigns={allCampaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll} metricKeys={metricKeys} fmtCell={tableFmt}/>
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
    metricKeys:["sessions","users","pageviews","conversions","revenue"],
    tableFmt:(k,v)=>k==="revenue"?`$${v.toLocaleString()}`:v.toLocaleString(),
    charts:[
      { type:"area", title:"Sessions over Time", dataKey:"sessions" },
      { type:"area-pair", items:[{ title:"Revenue", dataKey:"revenue", fmtVal:(_,v)=>`$${v}` },{ title:"Conversions", dataKey:"conversions" }]},
      { type:"bar", title:"Total Pageviews by Channel", dataKey:"pageviews" },
    ],
  },
  facebook: {
    campaignKey:"facebook", title:"Facebook — Campaigns", accent:"#6BA82E",
    metricKeys:["impressions","clicks","spend","conversions"],
    tableFmt:(k,v)=>k==="spend"?`$${v.toLocaleString()}`:v.toLocaleString(),
    charts:[
      { type:"area", title:"Impressions over Time", dataKey:"impressions" },
      { type:"area-pair", items:[{ title:"Spend", dataKey:"spend", fmtVal:(_,v)=>`$${v}` },{ title:"Clicks", dataKey:"clicks" }]},
      { type:"bar", title:"Total Conversions by Campaign", dataKey:"conversions" },
    ],
  },
  instagram: {
    campaignKey:"instagram", title:"Instagram — Campaigns", accent:B.spyderGreen,
    metricKeys:["impressions","clicks","spend","conversions"],
    tableFmt:(k,v)=>k==="spend"?`$${v.toLocaleString()}`:v.toLocaleString(),
    charts:[
      { type:"area", title:"Impressions over Time", dataKey:"impressions" },
      { type:"area-pair", items:[{ title:"Spend", dataKey:"spend", fmtVal:(_,v)=>`$${v}` },{ title:"Clicks", dataKey:"clicks" }]},
      { type:"bar", title:"Total Conversions by Campaign", dataKey:"conversions" },
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

// ─── GOOGLE TAB — sub-nav ─────────────────────────────────────────────────────
const GOOGLE_SUBS = [
  { id:"googlePaid",    label:"Paid Search",  accent:B.hartyGreen  },
  { id:"googleOrganic", label:"Organic",      accent:"#6BA82E"     },
  { id:"analytics",     label:"Analytics",    accent:B.raptorYellow },
];

function GoogleTab() {
  const [sub, setSub] = useState("googlePaid");
  const bp = useBreakpoint();
  const activeSub = GOOGLE_SUBS.find(s=>s.id===sub);

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

      {/* Section content */}
      {sub !== "analytics" && <Section {...SECTIONS[sub]}/>}
      {sub === "analytics" && (
        <>
          <Section {...SECTIONS.analytics}/>
          {/* Divider */}
          <div style={{ height:1, background:B.border, margin:"32px 0 28px" }}/>
          <SearchTermsSection/>
        </>
      )}
    </>
  );
}

// ─── TOP-LEVEL NAV ────────────────────────────────────────────────────────────
const NAV = [
  { id:"google",    label:"Google",    accent:B.hartyGreen  },
  { id:"facebook",  label:"Facebook",  accent:"#6BA82E"     },
  { id:"instagram", label:"Instagram", accent:B.spyderGreen },
];

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [range, setRange]             = useState("30d");
  const [compareMode, setCompareMode] = useState("none");
  const [activeTab, setActiveTab]     = useState("google");
  const bp = useBreakpoint();

  return (
    <DashContext.Provider value={{ range, compareMode }}>
      <div style={{ minHeight:"100vh", background:B.bg, fontFamily:"'Barlow',sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; }
          ::-webkit-scrollbar { height:4px; width:4px; }
          ::-webkit-scrollbar-track { background:${B.bg}; }
          ::-webkit-scrollbar-thumb { background:${B.borderLight}; border-radius:2px; }
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{ background:B.deepBlack, borderBottom:`2px solid ${B.hartyGreen}`, position:"sticky", top:0, zIndex:100 }}>
          <div style={{ padding:bp.isMobile?"0 14px":"0 28px" }}>
            {/* Row 1: wordmark + controls */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:bp.isMobile?"10px 0 8px":"14px 0 12px", borderBottom:`1px solid ${B.border}`, flexWrap:"wrap", gap:8 }}>

              {/* Wordmark */}
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {/* K-Hart logo mark — simplified SVG inline */}
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
                <div style={{ display:"flex", gap:2, background:B.surface, padding:3, borderRadius:4, border:`1px solid ${B.border}` }}>
                  {RANGE_OPTS.map(r=>(
                    <button key={r} onClick={()=>setRange(r)} style={{ padding:bp.isMobile?"4px 10px":"5px 14px", borderRadius:3, border:"none", cursor:"pointer", fontSize:bp.isMobile?10:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em", background:range===r?B.hartyGreen:"transparent", color:range===r?B.deepBlack:B.textMuted, transition:"all 0.15s" }}>{r}</button>
                  ))}
                </div>
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
          {activeTab === "google"    && <GoogleTab/>}
          {activeTab === "facebook"  && <Section {...SECTIONS.facebook}/>}
          {activeTab === "instagram" && <Section {...SECTIONS.instagram}/>}
        </div>
      </div>
    </DashContext.Provider>
  );
}
