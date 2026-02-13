/**
 * TRMNL BayWheels Integration
 * Displays real-time bike availability for a specific BayWheels station
 */

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  const { config } = await import('dotenv');
  config();
}

// Configuration from environment variables (required)
const STATION_ID = process.env.STATION_ID;
const STATION_SHORT_NAME = process.env.STATION_SHORT_NAME;
const GBFS_BASE_URL = process.env.GBFS_BASE_URL || 'https://gbfs.lyft.com/gbfs/2.3/bay/en';

// Validate required configuration
if (!STATION_ID || !STATION_SHORT_NAME) {
  throw new Error('Missing required environment variables: STATION_ID and STATION_SHORT_NAME must be set in .env file');
}

/**
 * Fetch station information (static data like name, location)
 */
async function getStationInfo() {
  const response = await fetch(`${GBFS_BASE_URL}/station_information.json`);
  const data = await response.json();

  const station = data.data.stations.find(s => s.station_id === STATION_ID);
  return station;
}

/**
 * Fetch station status (real-time availability)
 */
async function getStationStatus() {
  const response = await fetch(`${GBFS_BASE_URL}/station_status.json`);
  const data = await response.json();

  const status = data.data.stations.find(s => s.station_id === STATION_ID);
  return status;
}

/**
 * Format timestamp to readable time
 */
function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Generate TRMNL markup
 */
function generateMarkup() {
  return `
<div class="layout layout--col gap--large">
  <div class="grid grid--cols-12 gap--medium">
    <!-- Bikes Available -->
    <div class="col col--span-4">
      <div class="item bg--dither-1">
        <div class="meta"></div>
        <div class="content text--center">
          <span class="value value--xxxlarge" data-value-fit="true">{{ bikes_available }}</span>
          <span class="label">Total Bikes</span>
        </div>
      </div>
    </div>

    <!-- eBikes Available -->
    <div class="col col--span-4">
      <div class="item bg--dither-1">
        <div class="meta"></div>
        <div class="content text--center">
          <span class="value value--xxxlarge" data-value-fit="true">{{ ebikes_available }}</span>
          <span class="label">eBikes</span>
        </div>
      </div>
    </div>

    <!-- Docks Available -->
    <div class="col col--span-4">
      <div class="item bg--dither-1">
        <div class="meta"></div>
        <div class="content text--center">
          <span class="value value--xxxlarge" data-value-fit="true">{{ docks_available }}</span>
          <span class="label">Docks Free</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Station Details -->
  <div class="w--full">
    <div class="item">
      <div class="content">
        <div class="label">{{ station_name }}</div>
        <div class="description">Last updated: {{ last_updated }}</div>
      </div>
    </div>
  </div>
</div>

<!-- Title Bar -->
<div class="title_bar">
  <span class="title">BayWheels</span>
  <span class="instance">{{ station_short_name }}</span>
</div>
  `.trim();
}

/**
 * Main handler function
 */
export async function handleRequest() {
  try {
    // Fetch both station info and status
    const [stationInfo, stationStatus] = await Promise.all([
      getStationInfo(),
      getStationStatus()
    ]);

    if (!stationInfo || !stationStatus) {
      throw new Error('Station not found');
    }

    // Calculate regular bikes (total - ebikes)
    const regularBikes = stationStatus.num_bikes_available - stationStatus.num_ebikes_available;

    // Prepare merge variables for TRMNL
    const mergeVariables = {
      station_name: stationInfo.name,
      station_short_name: STATION_SHORT_NAME,
      bikes_available: stationStatus.num_bikes_available,
      regular_bikes: regularBikes,
      ebikes_available: stationStatus.num_ebikes_available,
      docks_available: stationStatus.num_docks_available,
      capacity: stationInfo.capacity,
      is_renting: stationStatus.is_renting === 1 ? 'Yes' : 'No',
      is_returning: stationStatus.is_returning === 1 ? 'Yes' : 'No',
      last_updated: formatTime(stationStatus.last_reported)
    };

    // Return TRMNL webhook format
    return {
      merge_variables: mergeVariables,
      markup: generateMarkup()
    };

  } catch (error) {
    console.error('Error fetching BayWheels data:', error);

    // Return error state
    return {
      merge_variables: {
        station_name: 'Error',
        station_short_name: STATION_SHORT_NAME,
        bikes_available: '--',
        ebikes_available: '--',
        docks_available: '--',
        last_updated: 'Unavailable'
      },
      markup: generateMarkup()
    };
  }
}

// For local testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Testing BayWheels TRMNL Integration...\n');

  const result = await handleRequest();
  console.log('Response:');
  console.log(JSON.stringify(result, null, 2));
}
