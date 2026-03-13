export default async function handler(req, res) {
  const startDate = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const endDate   = req.query.end   || new Date().toISOString().slice(0,10);

  const pageId = process.env.META_PAGE_ID;
  const token  = process.env.META_PAGE_ACCESS_TOKEN;

  const since = Math.floor(new Date(startDate).getTime() / 1000);
  const until = Math.floor(new Date(endDate).getTime() / 1000) + 86400;

  const metrics = [
    'page_impressions_unique',
    'page_post_engagements',
  ].join(',');

  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}&access_token=${token}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.error) return res.status(500).json({ error: json.error.message });

    const byDate = {};
    (json.data || []).forEach(metric => {
      (metric.values || []).forEach(v => {
        const date = v.end_time.slice(0,10);
        if (!byDate[date]) byDate[date] = { date };
        const val = typeof v.value === 'object' ? Object.values(v.value).reduce((a,b)=>a+b,0) : (v.value||0);
        byDate[date][metric.name] = val;
      });
    });

    const rows = Object.values(byDate)
      .filter(r => r.date >= startDate && r.date <= endDate)
      .map(r => ({
        date:        r.date,
        reach:       r.page_impressions_unique || 0,
        engagements: r.page_post_engagements   || 0,
      }))
      .sort((a,b) => a.date.localeCompare(b.date));

    res.status(200).json(rows);
  } catch (err) {
    console.error('Page Insights Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
