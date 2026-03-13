import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export default async function handler(req, res) {
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

    res.status(200).json(rows);
  } catch (err) {
    console.error('GA4 Countries Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
