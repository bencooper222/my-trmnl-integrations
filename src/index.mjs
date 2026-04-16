/**
 * TRMNL BayWheels Integration
 * Displays real-time bike availability for multiple BayWheels stations
 */

const DEFAULT_GBFS_BASE_URL = 'https://gbfs.lyft.com/gbfs/2.3/bay/en';
const DISPLAY_TIMEZONE = 'America/Los_Angeles';

/**
 * Fetch all station information (static data like name, location)
 */
async function getAllStationInfo(baseUrl) {
  const response = await fetch(`${baseUrl}/station_information.json`);
  const data = await response.json();
  return data.data.stations;
}

/**
 * Fetch all station statuses (real-time availability)
 */
async function getAllStationStatus(baseUrl) {
  const response = await fetch(`${baseUrl}/station_status.json`);
  const data = await response.json();
  return data.data.stations;
}

/**
 * Format timestamp to readable time
 */
function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DISPLAY_TIMEZONE
  });
}

/**
 * Main handler function
 * @param {Object} config - Configuration object
 * @param {string} config.STATION_IDS - Comma-delimited GBFS station IDs
 * @param {string} config.STATION_SHORT_NAMES - Comma-delimited short names (parallel to STATION_IDS)
 * @param {string} [config.GBFS_BASE_URL] - Optional GBFS API base URL
 */
export async function handleRequest(config) {
  const stationIds = config.STATION_IDS ? config.STATION_IDS.split(',').map(s => s.trim()) : [];
  const shortNames = config.STATION_SHORT_NAMES ? config.STATION_SHORT_NAMES.split(',').map(s => s.trim()) : [];
  const baseUrl = config.GBFS_BASE_URL || DEFAULT_GBFS_BASE_URL;

  if (stationIds.length === 0 || shortNames.length === 0) {
    throw new Error('Missing required config: STATION_IDS and STATION_SHORT_NAMES');
  }

  // Fetch both datasets once, then extract per-station data
  const [allInfo, allStatus] = await Promise.all([
    getAllStationInfo(baseUrl),
    getAllStationStatus(baseUrl)
  ]);

  const stations = stationIds.map((stationId, i) => {
    const info = allInfo.find(s => s.station_id === stationId);
    const status = allStatus.find(s => s.station_id === stationId);

    if (!info || !status) {
      return {
        short_name: shortNames[i] || stationId,
        name: 'Unknown',
        bikes_available: '--',
        ebikes_available: '--',
        last_updated: 'N/A'
      };
    }

    return {
      short_name: shortNames[i] || info.short_name,
      name: info.name,
      bikes_available: status.num_bikes_available,
      ebikes_available: status.num_ebikes_available,
      last_updated: formatTime(status.last_reported)
    };
  });

  return {
    stations,
    last_updated: formatTime(Math.floor(Date.now() / 1000))
  };
}
