require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');

const app = express();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/ga4', async (req, res) => {
  const startDate = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const endDate   = req.query.end   || new Date().toISOString().slice(0,10);

  try {
    const analyticsdata = google.analyticsdata('v1beta');
    const response = await analyticsdata.properties.runReport({
      auth: oauth2Client,
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'date' },
          { name: 'sessionDefaultChannelGroup' }
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
          { name: 'averageSessionDuration' },
        ],
      },
    });

    const rows = (response.data.rows || []).map(row => ({
      date:        row.dimensionValues[0].value,
      channel:     row.dimensionValues[1].value,
      sessions:    parseInt(row.metricValues[0].value),
      users:       parseInt(row.metricValues[1].value),
      pageviews:   parseInt(row.metricValues[2].value),
      conversions: parseInt(row.metricValues[3].value),
      avgDuration: Math.round(parseFloat(row.metricValues[4].value)),
    }));

    res.json(rows);
  } catch (err) {
    console.error('GA4 Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Country data ─────────────────────────────────────────────────────────────
app.get('/api/ga4/countries', async (req, res) => {
  const startDate = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const endDate   = req.query.end   || new Date().toISOString().slice(0,10);

  try {
    const analyticsdata = google.analyticsdata('v1beta');
    const response = await analyticsdata.properties.runReport({
      auth: oauth2Client,
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'country' },
          { name: 'countryId' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'conversions' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 50,
      },
    });

    const rows = (response.data.rows || []).map(row => ({
      country:     row.dimensionValues[0].value,
      countryCode: row.dimensionValues[1].value,
      sessions:    parseInt(row.metricValues[0].value),
      users:       parseInt(row.metricValues[1].value),
      conversions: parseInt(row.metricValues[2].value),
    }));

    res.json(rows);
  } catch (err) {
    console.error('GA4 Countries Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Meta (Facebook/Instagram) data ──────────────────────────────────────────
app.get('/api/meta', async (req, res) => {
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

    res.json(rows);
  } catch (err) {
    console.error('Meta Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Facebook Page Insights (organic) ────────────────────────────────────────
app.get('/api/meta/page', async (req, res) => {
  const startDate = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const endDate   = req.query.end   || new Date().toISOString().slice(0,10);

  const pageId = process.env.META_PAGE_ID;
  const token  = process.env.META_PAGE_ACCESS_TOKEN;

  const metrics = [
    'page_impressions_unique',
    'page_post_engagements',
  ].join(',');

  // Chunk into 90-day windows to avoid API limits
  const chunks = [];
  let chunkStart = new Date(startDate);
  const finalEnd = new Date(endDate);
  while (chunkStart <= finalEnd) {
    const chunkEnd = new Date(Math.min(chunkStart.getTime() + 89 * 86400000, finalEnd.getTime()));
    chunks.push({
      since: Math.floor(chunkStart.getTime() / 1000),
      until: Math.floor(chunkEnd.getTime() / 1000) + 86400,
    });
    chunkStart = new Date(chunkEnd.getTime() + 86400000);
  }

  try {
    const byDate = {};

    await Promise.all(chunks.map(async ({ since, until }) => {
      const url = `https://graph.facebook.com/v19.0/${pageId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}&access_token=${token}`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.error) throw new Error(json.error.message);

      (json.data || []).forEach(metric => {
        (metric.values || []).forEach(v => {
          const date = v.end_time.slice(0,10);
          if (!byDate[date]) byDate[date] = { date };
          const val = typeof v.value === 'object' ? Object.values(v.value).reduce((a,b)=>a+b,0) : (v.value||0);
          byDate[date][metric.name] = val;
        });
      });
    }));

    const rows = Object.values(byDate)
      .filter(r => r.date >= startDate && r.date <= endDate)
      .map(r => ({
        date:        r.date,
        reach:       r.page_impressions_unique || 0,
        engagements: r.page_post_engagements   || 0,
      }))
      .sort((a,b) => a.date.localeCompare(b.date));

    res.json(rows);
  } catch (err) {
    console.error('Page Insights Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DEBUG: Facebook page metrics ────────────────────────────────────────────
app.get('/api/debug/page', async (req, res) => {
  const pageId = process.env.META_PAGE_ID;
  const token  = process.env.META_PAGE_ACCESS_TOKEN;
  const since  = Math.floor((Date.now() - 7 * 86400000) / 1000);
  const until  = Math.floor(Date.now() / 1000);
  const results = {};
  const metrics = ['page_impressions','page_impressions_unique','page_post_engagements','page_fan_adds_unique','page_fans'];
  await Promise.all(metrics.map(async m => {
    const url = `https://graph.facebook.com/v19.0/${pageId}/insights?metric=${m}&period=day&since=${since}&until=${until}&access_token=${token}`;
    const r = await fetch(url);
    const j = await r.json();
    results[m] = j.error ? j.error.message : `OK (${(j.data||[]).length} rows)`;
  }));
  res.json(results);
});


app.get('/api/debug/instagram', async (req, res) => {
  const igAccountId = process.env.META_IG_ACCOUNT_ID;
  const token       = process.env.META_ACCESS_TOKEN;
  const base        = `https://graph.facebook.com/v19.0/${igAccountId}/insights`;
  const since       = Math.floor((Date.now() - 7 * 86400000) / 1000);
  const until       = Math.floor(Date.now() / 1000);
  const url = `${base}?metric=profile_views,accounts_engaged,total_interactions&metric_type=total_value&period=day&since=${since}&until=${until}&access_token=${token}`;
  const r = await fetch(url);
  const j = await r.json();
  res.json(j);
});


app.get('/api/meta/instagram', async (req, res) => {
  const startDate = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const endDate   = req.query.end   || new Date().toISOString().slice(0,10);

  const igAccountId = process.env.META_IG_ACCOUNT_ID;
  const token       = process.env.META_ACCESS_TOKEN;
  const base        = `https://graph.facebook.com/v19.0/${igAccountId}/insights`;

  // Instagram Insights API has a hard 30-day limit — chunk into 30-day windows
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

      // url1 metrics come back as per-day values arrays
      (j1.data || []).forEach(metric => {
        (metric.values || []).forEach(v => {
          const date = v.end_time.slice(0,10);
          if (!byDate[date]) byDate[date] = { date };
          byDate[date][metric.name] = v.value || 0;
        });
      });

      // total_value aggregates — store as period totals, rounded to integers
      // We store them on the first date of the chunk so stat card totals are accurate
      const chunkFirstDate = new Date(since * 1000).toISOString().slice(0,10);
      if (!byDate[chunkFirstDate]) byDate[chunkFirstDate] = { date: chunkFirstDate };

      (j2.data || []).forEach(metric => {
        const total = Math.round(metric.total_value?.value || 0);
        // Add to first date of chunk — stat cards sum all dates so totals stay correct
        byDate[chunkFirstDate][metric.name] = (byDate[chunkFirstDate][metric.name] || 0) + total;
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

    res.json(rows);
  } catch (err) {
    console.error('Instagram Insights Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debug/adsets', async (req, res) => {
  const start = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const end   = req.query.end   || new Date().toISOString().slice(0,10);
  try {
    const url = `https://graph.facebook.com/v19.0/${process.env.META_AD_ACCOUNT_ID}/insights`
      + `?fields=campaign_name,adset_name,impressions,reach,spend,actions`
      + `&level=adset&time_increment=1`
      + `&time_range={"since":"${start}","until":"${end}"}`
      + `&access_token=${process.env.META_ACCESS_TOKEN}`;
    const r = await fetch(url);
    const j = await r.json();
    res.json(j);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/debug/ads', async (req, res) => {
  const start = req.query.start || (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
  const end   = req.query.end   || new Date().toISOString().slice(0,10);
  try {
    const url = `https://graph.facebook.com/v19.0/${process.env.META_AD_ACCOUNT_ID}/insights`
      + `?fields=campaign_name,adset_name,ad_name,impressions,reach,spend,actions`
      + `&level=ad&time_increment=1`
      + `&time_range={"since":"${start}","until":"${end}"}`
      + `&access_token=${process.env.META_ACCESS_TOKEN}`;
    const r = await fetch(url);
    const j = await r.json();
    res.json(j);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.listen(8080, () => {
  console.log('✅ API server running at http://localhost:8080');
});
