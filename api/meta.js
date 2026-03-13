export default async function handler(req, res) {
  const startDate = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const endDate   = req.query.end   || new Date().toISOString().slice(0,10);

  const accountId = process.env.META_AD_ACCOUNT_ID;
  const token     = process.env.META_ACCESS_TOKEN;

  try {
    const fields = 'campaign_name,date_start,impressions,reach,spend,actions';
    const url = `https://graph.facebook.com/v19.0/${accountId}/insights?fields=${fields}&time_range={"since":"${startDate}","until":"${endDate}"}&time_increment=1&level=campaign&breakdowns=publisher_platform&limit=500&access_token=${token}`;

    const response = await fetch(url);
    const json = await response.json();

    if (json.error) {
      return res.status(500).json({ error: json.error.message });
    }

    const getAction = (actions, type) =>
      parseInt((actions || []).find(a => a.action_type === type)?.value || 0);

    const rows = (json.data || []).map(row => {
      const actions = row.actions || [];
      return {
        date:        row.date_start,
        campaign:    row.campaign_name,
        platform:    row.publisher_platform || 'facebook',
        impressions: parseInt(row.impressions || 0),
        reach:       parseInt(row.reach || 0),
        spend:       parseFloat(row.spend || 0),
        linkClicks:  getAction(actions, 'link_click'),
        shares:      getAction(actions, 'post'),
        comments:    getAction(actions, 'comment'),
        saves:       getAction(actions, 'onsite_conversion.post_save'),
        reactions:   getAction(actions, 'post_reaction'),
        leads:       getAction(actions, 'lead') + getAction(actions, 'submit_application') + getAction(actions, 'complete_registration'),
      };
    });

    res.status(200).json(rows);
  } catch (err) {
    console.error('Meta Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
