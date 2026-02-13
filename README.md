# TRMNL BayWheels Integration

A TRMNL Framework v2 integration that displays real-time bike availability for BayWheels (Bay Area bike share) stations on your e-ink TRMNL device.

## Features

- Real-time bike availability
- Shows total bikes, eBikes, and available docks
- Displays station name and last update time
- Optimized for TRMNL 2-bit display
- Serverless deployment ready

## Station Configuration

Configure your station via environment variables:
- **Local development**: Edit `.env` file
- **Cloudflare Workers**: Edit `wrangler.toml` `[vars]` section

Required variables:
```env
STATION_ID=your-station-id-here
STATION_SHORT_NAME=SF-XXX-X
```

## Finding Your Station

1. Visit https://gbfs.lyft.com/gbfs/2.3/bay/en/station_information.json
2. Search for your desired station by name or short_name
3. Copy the `station_id` value

## Requirements

- Node.js 18+ (for native `fetch` support)
- If using `fnm`, the `.node-version` file will automatically use Node 18

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your station details:
   ```bash
   STATION_ID=your-station-id
   STATION_SHORT_NAME=SF-XXX-X
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Local Development

### Quick Test
```bash
npm test
```
Fetches live data once and displays the JSON response.

### Dev Server
```bash
npm run dev
```
Starts an HTTP server on `http://localhost:3000` that you can test with:
```bash
curl http://localhost:3000
```

The dev server:
- Loads configuration from `.env` file
- Responds to GET and POST requests
- Includes CORS headers for testing
- Logs each request with bike/dock availability
- Hot-reloads when you change station in `.env`

You can set a custom port:
```bash
PORT=8080 npm run dev
```

## Deployment Options

### Option 1: Cloudflare Workers (Recommended)

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Update `wrangler.toml`:
   - Add your account details
   - Configure the `[vars]` section with your station details

4. Deploy:
```bash
wrangler deploy
```

5. Your endpoint will be available at: `https://trmnl-baywheels.your-subdomain.workers.dev`

**Note**: Environment variables in Cloudflare Workers are set in `wrangler.toml` under the `[vars]` section, not from the `.env` file.

### Option 2: Other Serverless Platforms

The integration uses standard Web APIs and can be deployed to:
- Vercel (Edge Functions)
- Netlify (Edge Functions)
- AWS Lambda
- Any platform supporting Node.js serverless functions

You may need to adapt the entry point for your platform.

## TRMNL Setup

1. Create a new Private Plugin in your TRMNL dashboard
2. Set the webhook URL to your deployed endpoint
3. Use "Webhook - Pull" strategy
4. Set refresh interval (recommended: every 5-15 minutes)
5. The markup is automatically included in the response

## API Response Format

The endpoint returns JSON in TRMNL webhook format:

```json
{
  "merge_variables": {
    "station_name": "12 Grimmauld Place",
    "station_short_name": "HP-G12",
    "bikes_available": 13,
    "regular_bikes": 5,
    "ebikes_available": 8,
    "docks_available": 5,
    "capacity": 19,
    "is_renting": "Yes",
    "is_returning": "Yes",
    "last_updated": "2:52 PM"
  },
  "markup": "..."
}
```

## Rate Limits

TRMNL rate limits:
- Standard: 12 requests/hour (2kb max)
- TRMNL+: 30 requests/hour (5kb max)

GBFS data is typically updated every 30-60 seconds, so checking every 5-15 minutes is reasonable.

## Data Source

This integration uses the [General Bikeshare Feed Specification (GBFS)](https://gbfs.org/) from BayWheels/Lyft:
- Base URL: https://gbfs.lyft.com/gbfs/2.3/bay/en/
- Documentation: https://gbfs.org/specification/reference/

## License

MIT

## Resources

- [TRMNL Framework v2 Documentation](https://trmnl.com/framework/docs/v2_overview)
- [TRMNL Webhook API](https://docs.trmnl.com/go/private-plugins/webhooks)
- [BayWheels GBFS Feed](https://gbfs.baywheels.com/gbfs/2.3/gbfs.json)

Sources:
- [TRMNL Framework v2 Overview](https://trmnl.com/framework/docs/v2_overview)
- [TRMNL Webhooks Documentation](https://docs.trmnl.com/go/private-plugins/webhooks)
- [GBFS Specification](https://gbfs.org/)
