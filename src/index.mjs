/**
 * TRMNL BayWheels Integration
 * Displays real-time bike availability for a specific BayWheels station
 */

const DEFAULT_GBFS_BASE_URL = 'https://gbfs.lyft.com/gbfs/2.3/bay/en';

/**
 * Fetch station information (static data like name, location)
 */
async function getStationInfo(baseUrl, stationId) {
  const response = await fetch(`${baseUrl}/station_information.json`);
  const data = await response.json();

  const station = data.data.stations.find(s => s.station_id === stationId);
  return station;
}

/**
 * Fetch station status (real-time availability)
 */
async function getStationStatus(baseUrl, stationId) {
  const response = await fetch(`${baseUrl}/station_status.json`);
  const data = await response.json();

  const status = data.data.stations.find(s => s.station_id === stationId);
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
 * Main handler function
 * @param {Object} config - Configuration object
 * @param {string} config.STATION_ID - The GBFS station ID
 * @param {string} config.STATION_SHORT_NAME - Short name to display
 * @param {string} [config.GBFS_BASE_URL] - Optional GBFS API base URL
 */
export async function handleRequest(config) {
  const stationId = config.STATION_ID;
  const stationShortName = config.STATION_SHORT_NAME;
  const baseUrl = config.GBFS_BASE_URL || DEFAULT_GBFS_BASE_URL;

  if (!stationId || !stationShortName) {
    throw new Error('Missing required config: STATION_ID and STATION_SHORT_NAME');
  }

  try {
    // Fetch both station info and status
    const [stationInfo, stationStatus] = await Promise.all([
      getStationInfo(baseUrl, stationId),
      getStationStatus(baseUrl, stationId)
    ]);

    if (!stationInfo || !stationStatus) {
      throw new Error('Station not found');
    }

    // Calculate regular bikes (total - ebikes)
    const regularBikes = stationStatus.num_bikes_available - stationStatus.num_ebikes_available;

    // Prepare merge variables for TRMNL
    const mergeVariables = {
      station_name: stationInfo.name,
      station_short_name: stationShortName,
      bikes_available: stationStatus.num_bikes_available,
      regular_bikes: regularBikes,
      ebikes_available: stationStatus.num_ebikes_available,
      docks_available: stationStatus.num_docks_available,
      capacity: stationInfo.capacity,
      is_renting: stationStatus.is_renting === 1 ? 'Yes' : 'No',
      is_returning: stationStatus.is_returning === 1 ? 'Yes' : 'No',
      last_updated: formatTime(stationStatus.last_reported)
    };

    // Return flat merge variables for TRMNL
    return mergeVariables;

  } catch (error) {
    console.error('Error fetching BayWheels data:', error);

    // Return error state
    return {
      station_name: 'Error',
      station_short_name: stationShortName || 'Unknown',
      bikes_available: '--',
      ebikes_available: '--',
      docks_available: '--',
      last_updated: 'Unavailable'
    };
  }
}
