async function fetchAllPages(url) {
  let rows = [];
  let nextUrl = url;
  while (nextUrl) {
    const r = await fetch(nextUrl);
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    rows = rows.concat(j.data || []);
    nextUrl = j.paging?.next || null;
  }
  return rows;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const startDate = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const endDate   = req.query.end   || new Date().toISOString().slice(0,10);
  const accountId = process.env.META_AD_ACCOUNT_ID;
  const token     = process.env.META_ACCESS_TOKEN;
  try {
    const fields = 'campaign_name,adset_name,ad_name,date_start,impressions,reach,spend,actions';
    const url = `https://graph.facebook.com/v19.0/${accountId}/insights?fields=${fields}&time_range={"since":"${startDate}","until":"${endDate}"}&time_increment=1&level=ad&limit=500&access_token=${token}`;
    const data = await fetchAllPages(url);
    const getAction = (actions, type) => parseInt((actions||[]).find(a=>a.action_type===type)?.value||0);
    const rows = data.map(row => ({
      date:        row.date_start,
      campaign:    row.campaign_name,
      adset:       row.adset_name,
      ad:          row.ad_name,
      impressions: parseInt(row.impressions||0),
      reach:       parseInt(row.reach||0),
      spend:       parseFloat(row.spend||0),
      linkClicks:  getAction(row.actions,'link_click'),
      shares:      getAction(row.actions,'post'),
      comments:    getAction(row.actions,'comment'),
      saves:       getAction(row.actions,'onsite_conversion.post_save'),
      reactions:   getAction(row.actions,'post_reaction'),
      leads:       getAction(row.actions,'lead') + getAction(row.actions,'submit_application') + getAction(row.actions,'complete_registration'),
    }));
    res.json(rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
}
