export default async function handler(req, res) {
  const startDate = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const endDate   = req.query.end   || new Date().toISOString().slice(0,10);

  const igAccountId = process.env.META_IG_ACCOUNT_ID;
  const token       = process.env.META_ACCESS_TOKEN;
  const base        = `https://graph.facebook.com/v19.0/${igAccountId}/insights`;

  // Chunk into 30-day windows (API hard limit)
  const chunks = [];
  let chunkStart = new Date(startDate);
  const finalEnd = new Date(endDate);
  while (chunkStart <= finalEnd) {
    const chunkEnd = new Date(Math.min(chunkStart.getTime() + 29 * 86400000, finalEnd.getTime()));
    chunks.push({
      since: Math.floor(chunkStart.getTime() / 1000),
      until: Math.floor(chunkEnd.getTime() / 1000) + 86400,
    });
    chunkStart = new Date(chunkEnd.getTime() + 86400000);
  }

  try {
    const byDate = {};

    await Promise.all(chunks.map(async ({ since, until }, idx) => {
      const isLastChunk = idx === chunks.length - 1;
      const reachMetrics = isLastChunk ? 'reach,follower_count' : 'reach';
      const url1 = `${base}?metric=${reachMetrics}&period=day&since=${since}&until=${until}&access_token=${token}`;
      const url2 = `${base}?metric=profile_views,accounts_engaged,total_interactions&metric_type=total_value&period=day&since=${since}&until=${until}&access_token=${token}`;

      const [r1, r2] = await Promise.all([fetch(url1), fetch(url2)]);
      const [j1, j2] = await Promise.all([r1.json(), r2.json()]);

      if (j1.error) throw new Error(j1.error.message);
      if (j2.error) throw new Error(j2.error.message);

      // Per-day values
      (j1.data || []).forEach(metric => {
        (metric.values || []).forEach(v => {
          const date = v.end_time.slice(0,10);
          if (!byDate[date]) byDate[date] = { date };
          byDate[date][metric.name] = v.value || 0;
        });
      });

      // total_value aggregates — store as integers on chunk's first date
      const since_date = new Date(since * 1000).toISOString().slice(0,10);
      if (!byDate[since_date]) byDate[since_date] = { date: since_date };

      (j2.data || []).forEach(metric => {
        const total = Math.round(metric.total_value?.value || 0);
        byDate[since_date][metric.name] = (byDate[since_date][metric.name] || 0) + total;
      });
    }));

    const rows = Object.values(byDate)
      .filter(r => r.date >= startDate && r.date <= endDate)
      .map(r => ({
        date:         r.date,
        reach:        r.reach              || 0,
        profileViews: r.profile_views      || 0,
        newFollowers: r.follower_count     || 0,
        engaged:      r.accounts_engaged   || 0,
        interactions: r.total_interactions || 0,
      }))
      .sort((a,b) => a.date.localeCompare(b.date));

    res.status(200).json(rows);
  } catch (err) {
    console.error('Instagram Insights Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
