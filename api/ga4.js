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

    // Fetch channel breakdown for charts
    const response = await analyticsdata.properties.runReport({
      auth: oauth2Client,
      property: `properties/${process.env.GOOGLE_GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
          { name: 'averageSessionDuration' },
        ],
        keepEmptyRows: false,
      },
    });

    // Fetch user total without channel to avoid cross-channel double counting
    const userResponse = await analyticsdata.properties.runReport({
      auth: oauth2Client,
      property: `properties/${process.env.GOOGLE_GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }],
        keepEmptyRows: false,
      },
    });

    const userByDate = {};
    (userResponse.data.rows || []).forEach(row => {
      userByDate[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value);
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

    // Send deduplicated daily user totals separately for accurate user count display
    const userTotals = Object.entries(userByDate).map(([date, users]) => ({ date, users }));

    res.status(200).json({ rows, userTotals });
  } catch (err) {
    console.error('GA4 Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
