import { useState, useMemo, createContext, useContext, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

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
  return {
    width,
    isMobile:  width < 640,
    isTablet:  width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
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
    { id:"gp1", name:"Brand — Exact Match",       color:"#EA4335", seeds:{ impressions:8200, clicks:620, spend:190, conversions:14 }, seedBase:11 },
    { id:"gp2", name:"Competitor Conquesting",     color:"#FF8A65", seeds:{ impressions:5100, clicks:280, spend:95,  conversions:7  }, seedBase:22 },
    { id:"gp3", name:"Generic — High Intent",      color:"#FFAB40", seeds:{ impressions:4400, clicks:200, spend:82,  conversions:5  }, seedBase:33 },
    { id:"gp4", name:"Retargeting — Cart Abandon", color:"#FFD54F", seeds:{ impressions:1960, clicks:88,  spend:38,  conversions:4  }, seedBase:44 },
  ],
  googleOrganic: [
    { id:"go1", name:"Blog / Editorial",           color:"#34A853", seeds:{ impressions:4200, clicks:310, sessions:280, conversions:6 }, seedBase:55 },
    { id:"go2", name:"Product Pages",              color:"#00C853", seeds:{ impressions:2800, clicks:200, sessions:180, conversions:5 }, seedBase:66 },
    { id:"go3", name:"Landing Pages",              color:"#69F0AE", seeds:{ impressions:1700, clicks:110, sessions:95,  conversions:3 }, seedBase:77 },
  ],
  ga4: [
    { id:"ga1",  name:"Paid Search",               color:"#F9AB00", seeds:{ sessions:1800, users:1300, pageviews:5200, conversions:28, revenue:1400 }, seedBase:154 },
    { id:"ga2",  name:"Organic Search",            color:"#FCD34D", seeds:{ sessions:1200, users:900,  pageviews:3600, conversions:18, revenue:900  }, seedBase:165 },
    { id:"ga3",  name:"Paid Social",               color:"#FDE68A", seeds:{ sessions:800,  users:620,  pageviews:2200, conversions:11, revenue:560  }, seedBase:176 },
    { id:"ga4d", name:"Direct / Email",            color:"#FFF176", seeds:{ sessions:480,  users:370,  pageviews:1400, conversions:8,  revenue:380  }, seedBase:187 },
  ],
  facebook: [
    { id:"fb1", name:"Prospecting — Lookalike",    color:"#1877F2", seeds:{ impressions:14000, clicks:310, spend:82, conversions:5 }, seedBase:88 },
    { id:"fb2", name:"Retargeting — Visitors",     color:"#42A5F5", seeds:{ impressions:8200,  clicks:180, spend:48, conversions:3 }, seedBase:99 },
    { id:"fb3", name:"Brand Awareness",            color:"#90CAF9", seeds:{ impressions:6100,  clicks:95,  spend:32, conversions:2 }, seedBase:110 },
  ],
  instagram: [
    { id:"ig1", name:"Stories — Product Demo",     color:"#E1306C", seeds:{ impressions:18000, clicks:360, spend:55, conversions:6 }, seedBase:121 },
    { id:"ig2", name:"Feed — UGC Creative",        color:"#F06292", seeds:{ impressions:13000, clicks:280, spend:42, conversions:5 }, seedBase:132 },
    { id:"ig3", name:"Reels — Top of Funnel",      color:"#F48FB1", seeds:{ impressions:10000, clicks:165, spend:28, conversions:3 }, seedBase:143 },
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

const COMP_COLORS = { High:"#EF4444", Medium:"#F59E0B", Low:"#22C55E" };
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
  const toggle = (id) => setHidden(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    const allIds = campaigns.map(c => c.id);
    const allHidden = allIds.every(id => hidden.has(id));
    setHidden(allHidden ? new Set() : new Set(allIds));
  };
  const visible = campaigns.filter(c => !hidden.has(c.id));
  return { hidden, toggle, toggleAll, visible };
}

// ─── CAMPAIGN FILTER BAR ──────────────────────────────────────────────────────
function CampaignFilterBar({ campaigns, hidden, toggle, toggleAll }) {
  const bp = useBreakpoint();
  const allHidden = campaigns.every(c => hidden.has(c.id));
  const someHidden = campaigns.some(c => hidden.has(c.id));

  return (
    <div style={{
      display:"flex", alignItems:"center", flexWrap:"wrap", gap:6,
      background:"#0C0E1E", borderRadius:12,
      padding: bp.isMobile ? "8px 10px" : "10px 14px",
      border:"1px solid #1E2140", marginBottom:16,
    }}>
      {/* Select all */}
      <button onClick={toggleAll} style={{
        display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
        borderRadius:7, border:"1px solid #2E3152", background:"transparent",
        cursor:"pointer", fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
        color:"#7A7F99", transition:"all 0.12s",
      }}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#4A4F6A"}
        onMouseLeave={e=>e.currentTarget.style.borderColor="#2E3152"}>
        <span style={{
          width:13, height:13, borderRadius:3,
          border:`1.5px solid ${someHidden?"#4A5080":"#818CF8"}`,
          background: allHidden ? "transparent" : someHidden ? "#2E3152" : "#818CF8",
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          position:"relative"
        }}>
          {!allHidden && someHidden && <span style={{ width:7, height:2, background:"#818CF8", borderRadius:1, position:"absolute" }}/>}
          {!allHidden && !someHidden && <span style={{ color:"#0C0E1E", fontSize:9, fontWeight:900, lineHeight:1 }}>✓</span>}
        </span>
        All
      </button>

      <div style={{ width:1, height:18, background:"#1E2140" }}/>

      {/* Per-campaign pills */}
      {campaigns.map(c => {
        const checked = !hidden.has(c.id);
        return (
          <button key={c.id} onClick={() => toggle(c.id)} style={{
            display:"flex", alignItems:"center", gap:7, padding:"4px 11px",
            borderRadius:99, border:`1.5px solid ${checked ? c.color+"66" : "#1E2140"}`,
            background: checked ? c.color+"18" : "transparent",
            cursor:"pointer", fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
            color: checked ? c.color : "#3A3F5A",
            transition:"all 0.12s",
            opacity: checked ? 1 : 0.5,
          }}>
            {/* Custom checkbox */}
            <span style={{
              width:12, height:12, borderRadius:3, flexShrink:0,
              border:`1.5px solid ${checked ? c.color : "#2E3152"}`,
              background: checked ? c.color : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.12s",
            }}>
              {checked && <span style={{ color:"#000", fontSize:8, fontWeight:900, lineHeight:1 }}>✓</span>}
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
  const positive = inverted ? value<0 : value>0;
  return (
    <span style={{ fontSize:10, color:positive?"#22C55E":"#EF4444", fontFamily:"monospace", marginLeft:5 }}>
      {value>0?"▲":"▼"}{Math.abs(value).toFixed(1)}%
    </span>
  );
}

function StatCard({ label, curr, prev, color, fmt=fmtK, inverted=false }) {
  const delta = prev!=null ? pctDelta(curr,prev) : null;
  return (
    <div style={{ background:"#0C0E1E", borderRadius:10, padding:"10px 14px", border:"1px solid #1E2140", flex:"1 1 110px" }}>
      <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:"#4A4F6A", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>{label}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
        <span style={{ fontSize:17, fontWeight:700, color:color||"#E8EAF2", fontFamily:"'IBM Plex Mono',monospace" }}>{fmt(curr)}</span>
        <Delta value={delta} inverted={inverted}/>
      </div>
      {prev!=null && <div style={{ fontSize:9, color:"#2E3152", marginTop:3, fontFamily:"monospace" }}>prev: {fmt(prev)}</div>}
    </div>
  );
}

function ChartTooltip({ active, payload, label, fmtVal }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"#1A1C34", border:"1px solid #2E3152", borderRadius:10, padding:"10px 14px", fontSize:11, fontFamily:"'IBM Plex Mono',monospace", maxWidth:240 }}>
      <div style={{ color:"#7A7F99", marginBottom:6 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ color:p.color, marginBottom:2 }}>
          {p.name}: <strong>{fmtVal ? fmtVal(p.name,p.value) : fmtK(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title, accent }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
      <div style={{ width:3, height:20, borderRadius:99, background:accent }}/>
      <span style={{ fontSize:12, fontFamily:"'IBM Plex Mono',monospace", color:"#7A7F99", textTransform:"uppercase", letterSpacing:"0.12em" }}>{title}</span>
    </div>
  );
}

function CompareLabel({ compareMode }) {
  if (!compareMode||compareMode==="none") return null;
  const m = COMPARE_OPTS.find(o=>o.value===compareMode);
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:99, background:"#1E2140", fontSize:9, fontFamily:"monospace", color:"#818CF8", marginBottom:14 }}>
      <span style={{ opacity:0.7 }}>⇄</span> Comparing: {m?.label}
      <span style={{ display:"inline-flex", gap:10, marginLeft:8 }}>
        <span style={{ color:"#E8EAF2" }}>— current</span>
        <span style={{ color:"#818CF8", opacity:0.5 }}>- - prev</span>
      </span>
    </div>
  );
}

function ChartCard({ title, accent, children }) {
  return (
    <div style={{ background:"#12142A", borderRadius:16, padding:"18px 20px", border:`1px solid ${accent}33`, marginBottom:14 }}>
      <div style={{ fontSize:12, color:"#C8CADC", fontWeight:600, marginBottom:16 }}>{title}</div>
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
    const allCamps = Object.values(CAMPAIGNS).flat();
    const base = allCamps[0].data.slice(-n);
    return base.map((row, i) => {
      const pt = { date: row.date };
      campaigns.forEach(c => {
        pt[`curr_${c.id}`] = c.data.slice(-n)[i]?.[dataKey] ?? 0;
        if (comparing) {
          const { prev } = slicePeriods(c.data, range, compareMode);
          pt[`prev_${c.id}`] = prev?.[i]?.[dataKey] ?? 0;
        }
      });
      return pt;
    });
  }, [campaigns, range, compareMode, dataKey, n]);

  if (!campaigns.length) return (
    <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:"#2E3152", fontSize:11, fontFamily:"monospace" }}>
      No campaigns selected
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          {campaigns.map(c=>(
            <linearGradient key={c.id} id={`ag_${c.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={c.color} stopOpacity={0.25}/>
              <stop offset="95%" stopColor={c.color} stopOpacity={0}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2140"/>
        <XAxis dataKey="date" tick={{ fill:"#4A4F6A", fontSize:9, fontFamily:"monospace" }} tickLine={false} interval="preserveStartEnd"/>
        <YAxis tick={{ fill:"#4A4F6A", fontSize:9, fontFamily:"monospace" }} tickLine={false} axisLine={false} tickFormatter={fmtK}/>
        <Tooltip content={<ChartTooltip fmtVal={fmtVal}/>}/>
        <Legend wrapperStyle={{ fontSize:9, fontFamily:"monospace", color:"#7A7F99" }}/>
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
    return {
      name: c.name.length>20 ? c.name.slice(0,20)+"…" : c.name,
      curr: curr.reduce((a,b)=>a+(b[dataKey]||0),0),
      prev: prev ? prev.reduce((a,b)=>a+(b[dataKey]||0),0) : null,
      color: c.color,
    };
  }), [campaigns, range, compareMode, dataKey]);

  if (!campaigns.length) return (
    <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:"#2E3152", fontSize:11, fontFamily:"monospace" }}>
      No campaigns selected
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left:0, right:24 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2140" horizontal={false}/>
        <XAxis type="number" tick={{ fill:"#4A4F6A", fontSize:9, fontFamily:"monospace" }} tickLine={false} axisLine={false} tickFormatter={fmtK}/>
        <YAxis type="category" dataKey="name" tick={{ fill:"#C8CADC", fontSize:9, fontFamily:"monospace" }} tickLine={false} axisLine={false} width={148}/>
        <Tooltip content={<ChartTooltip fmtVal={fmtVal}/>}/>
        {comparing && <Legend wrapperStyle={{ fontSize:9, fontFamily:"monospace", color:"#7A7F99" }}/>}
        <Bar dataKey="curr" name="Current" radius={[0,4,4,0]} opacity={0.9}>
          {data.map((e,i)=><Cell key={i} fill={e.color}/>)}
        </Bar>
        {comparing && <Bar dataKey="prev" name="Prev. period" fill="#4A5080" radius={[0,4,4,0]} opacity={0.45}/>}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── CAMPAIGN TABLE ──────────────────────────────────────────────────────────
function CampaignTable({ allCampaigns, visible, hidden, toggle, toggleAll, metricKeys, fmtCell }) {
  const { range, compareMode } = useDash();
  const [sortKey, setSortKey] = useState(metricKeys[0]);
  const [sortDir, setSortDir] = useState("desc");
  const comparing = compareMode && compareMode !== "none";

  const rows = allCampaigns.map(c => {
    const { curr, prev } = slicePeriods(c.data, range, compareMode);
    return { ...c, currSum:sumKeys(curr,metricKeys), prevSum:prev?sumKeys(prev,metricKeys):null };
  }).sort((a,b)=>sortDir==="desc"?b.currSum[sortKey]-a.currSum[sortKey]:a.currSum[sortKey]-b.currSum[sortKey]);

  return (
    <div style={{ background:"#0C0E1E", borderRadius:12, border:"1px solid #1E2140", overflow:"hidden", marginTop:14 }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ background:"#12142A" }}>
            <th style={{ width:36, padding:"9px 0 9px 14px", borderBottom:"1px solid #1E2140" }}>
              {/* header all-toggle */}
              <span onClick={toggleAll} style={{
                width:13, height:13, borderRadius:3, border:`1.5px solid #4A5080`,
                background: allCampaigns.every(c=>!hidden.has(c.id)) ? "#818CF8" : allCampaigns.some(c=>!hidden.has(c.id)) ? "#2E3152" : "transparent",
                display:"inline-flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                position:"relative"
              }}>
                {allCampaigns.every(c=>!hidden.has(c.id)) && <span style={{ color:"#0C0E1E", fontSize:8, fontWeight:900 }}>✓</span>}
                {!allCampaigns.every(c=>!hidden.has(c.id))&&allCampaigns.some(c=>!hidden.has(c.id))&&<span style={{ width:7, height:2, background:"#818CF8", borderRadius:1, position:"absolute" }}/>}
              </span>
            </th>
            <th style={{ textAlign:"left", padding:"9px 14px", fontSize:9, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.1em", color:"#4A4F6A", borderBottom:"1px solid #1E2140" }}>Campaign</th>
            {metricKeys.map(k=>(
              <th key={k} onClick={()=>k===sortKey?setSortDir(d=>d==="desc"?"asc":"desc"):(setSortKey(k),setSortDir("desc"))}
                style={{ textAlign:"right", padding:"9px 14px", fontSize:9, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.1em", color:sortKey===k?"#818CF8":"#4A4F6A", cursor:"pointer", borderBottom:"1px solid #1E2140", userSelect:"none", whiteSpace:"nowrap" }}>
                {k}{sortKey===k?(sortDir==="desc"?" ↓":" ↑"):""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row=>{
            const isVisible = !hidden.has(row.id);
            return (
              <tr key={row.id} style={{ borderBottom:"1px solid #1A1C34", opacity:isVisible?1:0.35, transition:"opacity 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#12142A"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {/* Checkbox cell */}
                <td style={{ padding:"10px 0 10px 14px", verticalAlign:"middle" }}>
                  <span onClick={()=>toggle(row.id)} style={{
                    width:13, height:13, borderRadius:3, flexShrink:0,
                    border:`1.5px solid ${isVisible?row.color:"#2E3152"}`,
                    background: isVisible ? row.color : "transparent",
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    cursor:"pointer", transition:"all 0.12s",
                  }}>
                    {isVisible && <span style={{ color:"#000", fontSize:8, fontWeight:900, lineHeight:1 }}>✓</span>}
                  </span>
                </td>
                <td style={{ padding:"10px 14px", verticalAlign:"middle" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:9, height:9, borderRadius:3, background:row.color, flexShrink:0 }}/>
                    <span style={{ color:isVisible?"#E8EAF2":"#4A4F6A", fontWeight:500 }}>{row.name}</span>
                  </div>
                </td>
                {metricKeys.map(k=>{
                  const delta = row.prevSum ? pctDelta(row.currSum[k],row.prevSum[k]) : null;
                  return (
                    <td key={k} style={{ textAlign:"right", padding:"10px 14px", fontFamily:"monospace" }}>
                      <span style={{ color:isVisible?row.color:"#3A3F5A" }}>{fmtCell(k,row.currSum[k])}</span>
                      {delta!==null&&isVisible&&<span style={{ fontSize:9, color:delta>=0?"#22C55E":"#EF4444", marginLeft:5 }}>{delta>=0?"▲":"▼"}{Math.abs(delta).toFixed(0)}%</span>}
                      {comparing&&row.prevSum&&isVisible&&<div style={{ fontSize:9, color:"#2E3152" }}>{fmtCell(k,row.prevSum[k])}</div>}
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

  const allCurr = allCampaigns.flatMap(c => slicePeriods(c.data,range,compareMode).curr);
  const allPrev = compareMode&&compareMode!=="none" ? allCampaigns.flatMap(c=>slicePeriods(c.data,range,compareMode).prev||[]) : null;
  const tc = sumKeys(allCurr,metricKeys);
  const tp = allPrev ? sumKeys(allPrev,metricKeys) : {};

  return (
    <>
      <SectionHeader title={title} accent={accent}/>
      <CompareLabel compareMode={compareMode}/>

      {/* Summary stats */}
      <div style={{ display:"flex", gap: bp.isMobile ? 8 : 10, flexWrap:"wrap", marginBottom:16 }}>
        {metricKeys.map(k=>(
          <StatCard key={k} label={k} curr={tc[k]} prev={tp[k]} color={accent}
            fmt={k==="spend"||k==="revenue"?fmtD:fmtK}/>
        ))}
      </div>

      {/* Campaign filter bar */}
      <CampaignFilterBar campaigns={allCampaigns} hidden={hidden} toggle={toggle} toggleAll={toggleAll}/>

      {/* Charts */}
      {charts.map((chart, ci) => {
        if (chart.type === "area") {
          return (
            <ChartCard key={ci} title={chart.title} accent={accent}>
              <CampaignAreaChart campaigns={visible} dataKey={chart.dataKey} height={bp.isMobile ? 160 : chart.height||200} fmtVal={chart.fmtVal}/>
            </ChartCard>
          );
        }
        if (chart.type === "area-pair") {
          return (
            <div key={ci} style={{ display:"grid", gridTemplateColumns: bp.isMobile ? "1fr" : "1fr 1fr", gap:14 }}>
              {chart.items.map((item,ii)=>(
                <ChartCard key={ii} title={item.title} accent={accent}>
                  <CampaignAreaChart campaigns={visible} dataKey={item.dataKey} height={bp.isMobile ? 150 : 160} fmtVal={item.fmtVal}/>
                </ChartCard>
              ))}
            </div>
          );
        }
        if (chart.type === "bar") {
          return (
            <ChartCard key={ci} title={chart.title} accent={accent}>
              <CampaignBarChart campaigns={visible} dataKey={chart.dataKey} height={chart.height||160} fmtVal={chart.fmtVal}/>
            </ChartCard>
          );
        }
        return null;
      })}

      {/* Table */}
      <CampaignTable
        allCampaigns={allCampaigns} visible={visible}
        hidden={hidden} toggle={toggle} toggleAll={toggleAll}
        metricKeys={metricKeys} fmtCell={tableFmt}/>
    </>
  );
}

// ─── SECTION CONFIGS ─────────────────────────────────────────────────────────
const SECTIONS = {
  gp: {
    campaignKey:"googlePaid", title:"Google Ads — Paid", accent:"#EA4335",
    metricKeys:["impressions","clicks","spend","conversions"],
    tableFmt:(k,v)=>k==="spend"?`$${v.toLocaleString()}`:v.toLocaleString(),
    charts:[
      { type:"area",      title:"Impressions by Campaign",       dataKey:"impressions" },
      { type:"area-pair", items:[
        { title:"Spend by Campaign",       dataKey:"spend",       fmtVal:(_,v)=>`$${v}` },
        { title:"Conversions by Campaign", dataKey:"conversions"  },
      ]},
      { type:"bar",  title:"Campaign Totals — Clicks", dataKey:"clicks" },
    ],
  },
  go: {
    campaignKey:"googleOrganic", title:"Google Search — Organic", accent:"#34A853",
    metricKeys:["impressions","clicks","sessions","conversions"],
    tableFmt:(_,v)=>v.toLocaleString(),
    charts:[
      { type:"area",      title:"Clicks by Content Type",         dataKey:"clicks" },
      { type:"area-pair", items:[
        { title:"Sessions by Content Type",     dataKey:"sessions"     },
        { title:"Conversions by Content Type",  dataKey:"conversions"  },
      ]},
      { type:"bar",  title:"Impressions — Content Type Totals", dataKey:"impressions" },
    ],
  },
  ga4: {
    campaignKey:"ga4", title:"Google Analytics 4 — by Channel", accent:"#F9AB00",
    metricKeys:["sessions","users","pageviews","conversions","revenue"],
    tableFmt:(k,v)=>k==="revenue"?`$${v.toLocaleString()}`:v.toLocaleString(),
    charts:[
      { type:"area",      title:"Sessions by Channel",     dataKey:"sessions"     },
      { type:"area-pair", items:[
        { title:"Revenue by Channel",     dataKey:"revenue",     fmtVal:(_,v)=>`$${v}` },
        { title:"Conversions by Channel", dataKey:"conversions"  },
      ]},
      { type:"bar",  title:"Pageviews — Channel Totals", dataKey:"pageviews" },
    ],
  },
  fb: {
    campaignKey:"facebook", title:"Facebook — Campaigns", accent:"#1877F2",
    metricKeys:["impressions","clicks","spend","conversions"],
    tableFmt:(k,v)=>k==="spend"?`$${v.toLocaleString()}`:v.toLocaleString(),
    charts:[
      { type:"area",      title:"Impressions by Campaign",  dataKey:"impressions" },
      { type:"area-pair", items:[
        { title:"Spend by Campaign",  dataKey:"spend",  fmtVal:(_,v)=>`$${v}` },
        { title:"Clicks by Campaign", dataKey:"clicks" },
      ]},
      { type:"bar",  title:"Campaign Totals — Conversions", dataKey:"conversions" },
    ],
  },
  ig: {
    campaignKey:"instagram", title:"Instagram — Campaigns", accent:"#E1306C",
    metricKeys:["impressions","clicks","spend","conversions"],
    tableFmt:(k,v)=>k==="spend"?`$${v.toLocaleString()}`:v.toLocaleString(),
    charts:[
      { type:"area",      title:"Impressions by Campaign",  dataKey:"impressions" },
      { type:"area-pair", items:[
        { title:"Spend by Campaign",  dataKey:"spend",  fmtVal:(_,v)=>`$${v}` },
        { title:"Clicks by Campaign", dataKey:"clicks" },
      ]},
      { type:"bar",  title:"Campaign Totals — Conversions", dataKey:"conversions" },
    ],
  },
};

// ─── SEARCH TERMS ────────────────────────────────────────────────────────────
function SearchTermsSection() {
  const [sortKey, setSortKey]     = useState("searches");
  const [sortDir, setSortDir]     = useState("desc");
  const [chartMetric, setChartMetric] = useState("searches");
  const sorted = [...TOP_SEARCH_TERMS].sort((a,b)=>sortDir==="desc"?b[sortKey]-a[sortKey]:a[sortKey]-b[sortKey]);
  const metricOpts = [
    { key:"searches",       label:"Searches",      color:"#818CF8" },
    { key:"paid_clicks",    label:"Paid Clicks",   color:"#EA4335" },
    { key:"organic_clicks", label:"Organic",       color:"#34A853" },
    { key:"cpc",            label:"CPC",           color:"#F9AB00" },
    { key:"ctr",            label:"CTR %",         color:"#38BDF8" },
  ];
  const am = metricOpts.find(m=>m.key===chartMetric);
  const chartData = [...TOP_SEARCH_TERMS].sort((a,b)=>b[chartMetric]-a[chartMetric])
    .map(t=>({ name:t.term.length>26?t.term.slice(0,26)+"…":t.term, value:t[chartMetric] }));
  const cols = ["term","searches","cpc","ctr","position","paid_clicks","organic_clicks","competition"];
  const fmtCell = (k,v) => k==="cpc"?`$${v.toFixed(2)}`:k==="ctr"?`${v}%`:k==="position"?v.toFixed(1):typeof v==="number"?v.toLocaleString():v;

  return (
    <>
      <SectionHeader title="Top 10 Search Terms" accent="#818CF8"/>
      <div style={{ background:"#12142A", borderRadius:16, padding:"18px 20px", border:"1px solid #818CF833", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <span style={{ fontSize:12, color:"#C8CADC", fontWeight:600 }}>Term Performance</span>
          <div style={{ display:"flex", gap:3, background:"#0C0E1E", borderRadius:8, padding:3 }}>
            {metricOpts.map(m=>(
              <button key={m.key} onClick={()=>setChartMetric(m.key)} style={{ padding:"4px 11px", borderRadius:6, border:"none", cursor:"pointer", fontSize:10, fontFamily:"'IBM Plex Mono',monospace", background:chartMetric===m.key?m.color:"transparent", color:chartMetric===m.key?"#0C0E1E":"#4A4F6A", fontWeight:chartMetric===m.key?700:400, transition:"all 0.15s" }}>{m.label}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={chartData} layout="vertical" margin={{ left:0, right:30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2140" horizontal={false}/>
            <XAxis type="number" tick={{ fill:"#4A4F6A", fontSize:9, fontFamily:"monospace" }} tickLine={false} axisLine={false} tickFormatter={v=>chartMetric==="cpc"?`$${v}`:chartMetric==="ctr"?`${v}%`:fmtK(v)}/>
            <YAxis type="category" dataKey="name" tick={{ fill:"#C8CADC", fontSize:10, fontFamily:"monospace" }} tickLine={false} axisLine={false} width={178}/>
            <Tooltip content={<ChartTooltip fmtVal={(_,v)=>chartMetric==="cpc"?`$${v.toFixed(2)}`:chartMetric==="ctr"?`${v}%`:v.toLocaleString()}/>}/>
            <Bar dataKey="value" fill={am.color} radius={[0,4,4,0]} opacity={0.9}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background:"#12142A", borderRadius:16, border:"1px solid #1E2140", overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:"#0C0E1E" }}>
                {cols.map(c=>(
                  <th key={c} onClick={()=>c!=="term"&&c!=="competition"&&(c===sortKey?setSortDir(d=>d==="desc"?"asc":"desc"):(setSortKey(c),setSortDir("desc")))}
                    style={{ textAlign:"left", padding:"10px 14px", fontSize:9, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.1em", color:sortKey===c?"#818CF8":"#4A4F6A", cursor:c!=="term"&&c!=="competition"?"pointer":"default", borderBottom:"1px solid #1E2140", userSelect:"none", whiteSpace:"nowrap" }}>
                    {c.replace("_"," ")}{sortKey===c?(sortDir==="desc"?" ↓":" ↑"):""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row,i)=>(
                <tr key={row.term} style={{ borderBottom:"1px solid #1A1C34" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#1A1C34"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {cols.map(c=>(
                    <td key={c} style={{ padding:"10px 14px", color:"#C8CADC", verticalAlign:"middle" }}>
                      {c==="term"?(<div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ width:18, height:18, borderRadius:5, background:"#1E2140", color:"#4A4F6A", fontSize:9, fontFamily:"monospace", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</span><span style={{ fontWeight:500, color:"#E8EAF2" }}>{row.term}</span></div>)
                      :c==="competition"?(<span style={{ fontSize:10, padding:"2px 9px", borderRadius:99, fontFamily:"monospace", fontWeight:700, background:`${COMP_COLORS[row.competition]}18`, color:COMP_COLORS[row.competition] }}>{row[c]}</span>)
                      :c==="searches"?(<div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ height:4, borderRadius:99, background:"#818CF8", width:`${Math.round((row.searches/18400)*50)}px`, minWidth:4 }}/><span style={{ fontFamily:"monospace" }}>{row.searches.toLocaleString()}</span></div>)
                      :(<span style={{ fontFamily:"monospace", color:c==="cpc"?"#F9AB00":c==="paid_clicks"?"#EA4335":c==="organic_clicks"?"#34A853":c==="position"?(row.position<=3?"#22C55E":row.position<=6?"#F59E0B":"#EF4444"):"#C8CADC" }}>{fmtCell(c,row[c])}</span>)}
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
      <button onClick={()=>setOpen(o=>!o)} style={{
        display:"flex", alignItems:"center", gap:6, padding: compact ? "5px 10px" : "7px 14px",
        borderRadius:8, border:`1px solid ${isActive?"#818CF8":"#1E2140"}`,
        background:isActive?"#818CF822":"#12142A", cursor:"pointer",
        fontSize: compact ? 10 : 11, fontFamily:"'IBM Plex Mono',monospace",
        color:isActive?"#818CF8":"#4A4F6A", transition:"all 0.15s", whiteSpace:"nowrap"
      }}>
        <span style={{ fontSize:12 }}>⇄</span>
        {!compact && (isActive ? current.label : "Compare to…")}
        {compact && <span style={{ fontSize:9 }}>{isActive ? "On" : "Cmp"}</span>}
        <span style={{ fontSize:9, opacity:0.6 }}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:"#1A1C34", border:"1px solid #2E3152", borderRadius:10, overflow:"hidden", zIndex:200, minWidth:190, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
          {COMPARE_OPTS.map(opt=>(
            <button key={opt.value} onClick={()=>{ onChange(opt.value); setOpen(false); }} style={{
              display:"block", width:"100%", textAlign:"left", padding:"10px 16px",
              border:"none", cursor:"pointer", fontSize:11, fontFamily:"'IBM Plex Mono',monospace",
              background:value===opt.value?"#2E3152":"transparent",
              color:value===opt.value?"#818CF8":"#C8CADC", transition:"background 0.1s"
            }}
              onMouseEnter={e=>e.currentTarget.style.background="#252742"}
              onMouseLeave={e=>e.currentTarget.style.background=value===opt.value?"#2E3152":"transparent"}>
              {opt.value==="none"?<span style={{ opacity:0.5 }}>{opt.label}</span>:opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"gp",  label:"Google Paid",    accent:"#EA4335" },
  { id:"go",  label:"Google Organic", accent:"#34A853" },
  { id:"ga4", label:"Analytics",      accent:"#F9AB00" },
  { id:"fb",  label:"Facebook",       accent:"#1877F2" },
  { id:"ig",  label:"Instagram",      accent:"#E1306C" },
  { id:"st",  label:"Search Terms",   accent:"#818CF8" },
];

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [range, setRange]             = useState("30d");
  const [compareMode, setCompareMode] = useState("none");
  const [activeTab, setActiveTab]     = useState("gp");
  const bp = useBreakpoint();

  return (
    <DashContext.Provider value={{ range, compareMode }}>
      <div style={{ minHeight:"100vh", background:"#0C0E1E", fontFamily:"'DM Sans',sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; }
          ::-webkit-scrollbar { height:4px; width:4px; }
          ::-webkit-scrollbar-track { background:#0C0E1E; }
          ::-webkit-scrollbar-thumb { background:#2E3152; border-radius:99px; }
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{ background:"#080A18", borderBottom:"1px solid #1E2140", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ maxWidth:"100%", margin:"0 auto", padding: bp.isMobile ? "0 14px" : "0 28px" }}>
            {/* Row 1: wordmark + controls */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding: bp.isMobile ? "10px 0 8px" : "14px 0 12px",
              borderBottom:"1px solid #1A1C30", flexWrap:"wrap", gap:8
            }}>
              <div style={{ fontSize: bp.isMobile ? 12 : 14, fontWeight:800, color:"#E8EAF2", fontFamily:"'IBM Plex Mono',monospace", letterSpacing:"-0.02em" }}>
                Metric Tracker
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                {/* Range pills */}
                <div style={{ display:"flex", gap:3, background:"#12142A", padding:3, borderRadius:9, border:"1px solid #1E2140" }}>
                  {RANGE_OPTS.map(r=>(
                    <button key={r} onClick={()=>setRange(r)} style={{
                      padding: bp.isMobile ? "4px 10px" : "5px 14px",
                      borderRadius:6, border:"none", cursor:"pointer",
                      fontSize: bp.isMobile ? 10 : 11, fontWeight:600,
                      fontFamily:"'IBM Plex Mono',monospace",
                      background:range===r?"#E8EAF2":"transparent",
                      color:range===r?"#0C0E1E":"#4A4F6A", transition:"all 0.15s"
                    }}>{r}</button>
                  ))}
                </div>
                {!bp.isMobile && <div style={{ width:1, height:20, background:"#1E2140" }}/>}
                <CompareDropdown value={compareMode} onChange={setCompareMode} compact={bp.isMobile}/>
              </div>
            </div>
            {/* Row 2: nav tabs */}
            <div style={{ display:"flex", overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
              {NAV.map(item=>(
                <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{
                  padding: bp.isMobile ? "10px 12px" : "13px 18px",
                  border:"none", cursor:"pointer", background:"transparent",
                  fontSize: bp.isMobile ? 10 : 11,
                  fontFamily:"'IBM Plex Mono',monospace", fontWeight:600,
                  color:activeTab===item.id?item.accent:"#4A4F6A",
                  borderBottom:activeTab===item.id?`2px solid ${item.accent}`:"2px solid transparent",
                  marginBottom:-1, whiteSpace:"nowrap", transition:"all 0.15s"
                }}>
                  {bp.isMobile ? item.label.split(" ")[0] : item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ maxWidth:"100%", margin:"0 auto", padding: bp.isMobile ? "16px 14px" : "30px 28px" }}>

          {/* Summary bar — 2 cols mobile, 3 cols tablet, 5 cols desktop */}
          <div style={{
            display:"grid",
            gridTemplateColumns: bp.isMobile ? "1fr 1fr" : bp.isTablet ? "repeat(3,1fr)" : "repeat(5,1fr)",
            gap: bp.isMobile ? 8 : 12,
            marginBottom: bp.isMobile ? 20 : 32
          }}>
            {[
              { label:"Total Spend",       value:"$18,260", color:"#818CF8" },
              { label:"Total Impressions", value:"2.95M",   color:"#38BDF8" },
              { label:"Total Conversions", value:"1,893",   color:"#34D399" },
              { label:"Blended ROAS",      value:"5.4×",    color:"#F472B6" },
              { label:"Organic Sessions",  value:"17.6K",   color:"#34A853" },
            ].map(s=>(
              <div key={s.label} style={{ background:"#12142A", borderRadius:12, padding: bp.isMobile ? "10px 12px" : "14px 18px", border:"1px solid #1E2140" }}>
                <div style={{ fontSize:8, fontFamily:"'IBM Plex Mono',monospace", color:"#4A4F6A", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5 }}>{s.label}</div>
                <div style={{ fontSize: bp.isMobile ? 16 : 20, fontWeight:800, color:s.color, fontFamily:"'IBM Plex Mono',monospace" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {activeTab!=="st" && SECTIONS[activeTab] && <Section {...SECTIONS[activeTab]}/>}
          {activeTab==="st" && <SearchTermsSection/>}
        </div>
      </div>
    </DashContext.Provider>
  );
}