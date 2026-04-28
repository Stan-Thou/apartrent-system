/**
 * ============================================
 * LEAFLET MAPS INTEGRATION - FREE ALTERNATIVE
 * ============================================
 * 
 * This is a FREE alternative to Google Maps using Leaflet.js and OpenStreetMap
 * 
 * ADVANTAGES:
 * - ✅ Completely FREE (no API key needed)
 * - ✅ No billing required
 * - ✅ No registration needed
 * - ✅ Open source
 * - ✅ Works offline with cached tiles
 * 
 * HOW IT WORKS:
 * 1. Loads Leaflet.js library (free, open source)
 * 2. Uses OpenStreetMap tiles (free, community-driven)
 * - Landlords can pick location on map
 * - Clients can view location and get directions
 */

// ============================================
// CONFIGURATION
// ============================================
const LEAFLET_CONFIG = {
  // Default location for landlords when pinning a new apartment (Paniqui, Tarlac)
  defaultCenter: [15.6689, 120.5819],
  defaultZoom: 13, // Lower number = more zoomed out (shows more area)
  searchZoom: 14, // Zoom level when searching for address
  tileProvider: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', // Free OpenStreetMap tiles
  tileOptions: {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    updateWhenIdle: true, // Better performance - updates when user stops panning
    keepBuffer: 2 // Keep tiles in buffer for smoother panning
  }
};

// Global map instances
let landlordMapPicker = null;
let clientMapViewer = null;
let currentMarker = null;
let modalMapInstance = null;

// ============================================
// STEP 1: LOAD LEAFLET.JS LIBRARY
// ============================================
function loadLeaflet() {
  return new Promise((resolve, reject) => {
    // If already loaded, use it
    if (window.L) {
      resolve(window.L);
      return;
    }

    // Load Leaflet CSS (Latest version 1.9.4)
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);
    }

    // Load Leaflet JavaScript (Latest version 1.9.4)
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.L) {
        resolve(window.L);
      } else {
        reject(new Error('Leaflet.js failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Leaflet.js script. Check internet connection.'));
    };

    document.head.appendChild(script);
  });
}

// ============================================
// STEP 2: LANDLORD MAP PICKER
// ============================================
async function initLandlordMapPicker(container, initialLocation = null, onLocationSelected = null) {
  try {
    const L = await loadLeaflet();
    
    // Show loading state
    if (container) {
      container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary, #666);"><div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color, #007bff); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div><p>Loading map...</p></div>';
    }

    const center = initialLocation ? [initialLocation.lat, initialLocation.lng] : LEAFLET_CONFIG.defaultCenter;
    
    // Create the map
    const map = L.map(container, {
      center: center,
      zoom: LEAFLET_CONFIG.defaultZoom,
      zoomControl: true,
      minZoom: 10, // Minimum zoom (more zoomed out)
      maxZoom: 19  // Maximum zoom (more zoomed in)
    });

    // Add OpenStreetMap tiles (free) with optimized settings
    L.tileLayer(LEAFLET_CONFIG.tileProvider, LEAFLET_CONFIG.tileOptions).addTo(map);

    // Add marker if location exists
    let marker = null;
    if (initialLocation) {
      marker = L.marker([initialLocation.lat, initialLocation.lng], {
        draggable: true
      }).addTo(map);
      currentMarker = marker;
    }

    // When user clicks on map, set location
    map.on('click', (e) => {
      const location = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };
      
      // Update or create marker
      if (marker) {
        marker.setLatLng([location.lat, location.lng]);
      } else {
        marker = L.marker([location.lat, location.lng], {
          draggable: true
        }).addTo(map);
        currentMarker = marker;
      }
      
      // Store location temporarily
      window.tempMapLocation = location;
      
      // Get address from coordinates
      getAddressFromCoordinates(location);
      
      // Callback for location selection
      if (onLocationSelected) {
        onLocationSelected(location);
      }
    });

    // When marker is dragged, update location
    if (marker) {
      marker.on('dragend', (e) => {
        const location = {
          lat: e.target.getLatLng().lat,
          lng: e.target.getLatLng().lng
        };
        window.tempMapLocation = location;
        getAddressFromCoordinates(location);
        if (onLocationSelected) {
          onLocationSelected(location);
        }
      });
    }

    // Add geocoding search (using Nominatim - free OpenStreetMap geocoding)
    const searchInput = document.getElementById('mapLocationSearchModal') || document.getElementById('mapLocationSearch') || document.getElementById('newMapLocationSearch');
    if (searchInput) {
      // Add search functionality
      let searchTimeout = null;
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length < 3) return;
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          searchAddress(query, (location, address) => {
            if (location) {
              map.setView([location.lat, location.lng], LEAFLET_CONFIG.searchZoom);
              if (marker) {
                marker.setLatLng([location.lat, location.lng]);
              } else {
                marker = L.marker([location.lat, location.lng], {
                  draggable: true
                }).addTo(map);
                currentMarker = marker;
              }
              window.tempMapLocation = location;
              window.tempMapAddress = address;
              if (onLocationSelected) {
                onLocationSelected(location);
              }
            }
          });
        }, 500);
      });
    }

    landlordMapPicker = map;
    return map;
  } catch (error) {
    console.error('Leaflet map error:', error);
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-secondary, #666);">
          <i class="fa-solid fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; color: #ff6b6b;"></i>
          <p style="font-weight: 600; margin-bottom: 8px;">Map Loading Error</p>
          <p style="font-size: 0.9rem;">${error.message || 'Failed to load map'}</p>
          <small style="color: var(--text-muted, #999);">Check internet connection</small>
        </div>
      `;
    }
    return null;
  }
}

// ============================================
// STEP 3: CLIENT MAP VIEWER WITH ROUTE
// ============================================
async function initClientMapViewer(container, location, apartmentTitle = 'Apartment Location') {
  try {
    const L = await loadLeaflet();
    
    // Show loading state
    if (container) {
      container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary, #666);"><div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color, #007bff); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div><p>Loading map...</p></div>';
    }
    
    // Validate location data
    if (!location || location.lat === undefined || location.lat === null || 
        location.lng === undefined || location.lng === null) {
      console.error('Location data missing:', location);
      if (container) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary, #666);">Location not available</div>';
      }
      return null;
    }
    
    // Validate coordinates are valid numbers
    if (isNaN(location.lat) || isNaN(location.lng) || 
        location.lat < -90 || location.lat > 90 || 
        location.lng < -180 || location.lng > 180) {
      console.error('Invalid coordinates:', location);
      if (container) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary, #666);">Invalid location coordinates</div>';
      }
      return null;
    }
    
    // Ensure container has proper dimensions before creating map
    if (!container.style.height || container.style.height === '0px' || container.style.height === '') {
      container.style.height = '400px';
      container.style.minHeight = '400px';
    }

    // Create the map centered on apartment
    const map = L.map(container, {
      center: [location.lat, location.lng],
      zoom: LEAFLET_CONFIG.defaultZoom,
      zoomControl: true,
      minZoom: 10, // Minimum zoom (more zoomed out)
      maxZoom: 19  // Maximum zoom (more zoomed in)
    });

    // Add OpenStreetMap tiles with optimized settings
    L.tileLayer(LEAFLET_CONFIG.tileProvider, LEAFLET_CONFIG.tileOptions).addTo(map);

    // Add marker for apartment - use simple, reliable divIcon
    const apartmentIcon = L.divIcon({
      className: 'apartment-marker',
      html: '<div style="background: #ff6b6b; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4); transform: rotate(-45deg); position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg); color: white; font-size: 16px; font-weight: bold;">📍</div></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
    
    // Create marker - this should always work
    const apartmentMarker = L.marker([location.lat, location.lng], { 
      icon: apartmentIcon,
      title: apartmentTitle,
      draggable: false,
      zIndexOffset: 1000 // Ensure marker is on top
    }).addTo(map);
    
    // Verify marker was added
    if (!apartmentMarker) {
      console.error('Failed to create marker');
      // Fallback to default marker
      L.marker([location.lat, location.lng]).addTo(map);
    }
    
    // Create popup with apartment info
    const popupContent = `
      <div style="text-align: center; padding: 4px;">
        <strong style="color: #ff6b6b; font-size: 14px;">📍 ${apartmentTitle}</strong><br>
        <small style="color: #666;">Apartment Location</small>
      </div>
    `;
    apartmentMarker.bindPopup(popupContent);
    
    // Ensure container has proper height
    if (!container.style.height || container.style.height === '0px' || container.style.height === '') {
      container.style.height = '400px';
      container.style.minHeight = '400px';
    }
    
    // Wait for map to be ready, then center and show marker
    map.whenReady(() => {
      map.invalidateSize();
      // Center map on marker
      map.setView([location.lat, location.lng], LEAFLET_CONFIG.defaultZoom);
      // Open popup to show marker is there
      setTimeout(() => {
        apartmentMarker.openPopup();
        // Ensure marker is in view
        map.setView([location.lat, location.lng], LEAFLET_CONFIG.defaultZoom, { animate: false });
      }, 300);
    });
    
    // Verify marker is on map
    const markerLatLng = apartmentMarker.getLatLng();
    console.log('✅ Apartment marker added at:', markerLatLng, 'Title:', apartmentTitle);

    // Store location for directions
    window.currentApartmentLocation = location;
    window.currentApartmentTitle = apartmentTitle;
    window.currentClientMap = map;
    window.currentApartmentMarker = apartmentMarker;

    // Try to get client's current location and show route
    getClientLocationAndShowRoute(map, location, apartmentTitle);

    clientMapViewer = map;
    return map;
  } catch (error) {
    console.error('Leaflet map viewer error:', error);
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-secondary, #666);">
          <i class="fa-solid fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; color: #ff6b6b;"></i>
          <p style="font-weight: 600; margin-bottom: 8px;">Map Loading Error</p>
          <p style="font-size: 0.9rem;">${error.message || 'Failed to load map'}</p>
        </div>
      `;
    }
    return null;
  }
}

// ============================================
// GET CLIENT LOCATION AND SHOW ROUTE
// ============================================
function getClientLocationAndShowRoute(map, apartmentLocation, apartmentTitle) {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    console.log('Geolocation is not supported by this browser');
    showRouteInfo('Location access not available. Click "Get Directions" to open in navigation app.', false);
    return;
  }

  // Show loading message
  showRouteInfo('Getting your location...', true);

  // Get client's current location
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const clientLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Show route from client to apartment
      showRouteOnMap(map, clientLocation, apartmentLocation, apartmentTitle);
    },
    (error) => {
      console.error('Geolocation error:', error);
      let message = 'Could not get your location. ';
      if (error.code === 1) {
        message += 'Please allow location access and try again.';
      } else {
        message += 'Click "Get Directions" to open in navigation app.';
      }
      showRouteInfo(message, false);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// ============================================
// SHOW ROUTE ON MAP
// ============================================
function showRouteOnMap(map, fromLocation, toLocation, apartmentTitle) {
  const L = window.L;
  if (!L) return;

  // Add marker for client's current location
  const clientIcon = L.divIcon({
    className: 'client-marker',
    html: '<div style="background: #4CAF50; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  
  const clientMarker = L.marker([fromLocation.lat, fromLocation.lng], { icon: clientIcon }).addTo(map);
  clientMarker.bindPopup('<strong>📍 Your Location</strong>').openPopup();

  // Calculate route using OSRM (Open Source Routing Machine) - free service
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLocation.lng},${fromLocation.lat};${toLocation.lng},${toLocation.lat}?overview=full&geometries=geojson`;
  
  fetch(osrmUrl)
    .then(response => response.json())
    .then(data => {
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.geometry;
        
        // Draw route on map
        const routeLine = L.geoJSON(geometry, {
          style: {
            color: '#007bff',
            weight: 5,
            opacity: 0.7
          }
        }).addTo(map);
        
        // Fit map to show both locations and route
        const bounds = routeLine.getBounds();
        map.fitBounds(bounds, { padding: [50, 50] });
        
        // Calculate distance and duration
        const distance = (route.distance / 1000).toFixed(2); // Convert to km
        const duration = Math.round(route.duration / 60); // Convert to minutes
        
        // Show route info
        const routeInfo = {
          distance: distance,
          duration: duration,
          from: fromLocation,
          to: toLocation
        };
        
        showRouteInfo(`Route found: ${distance} km, ~${duration} min`, true, routeInfo);
        
        // Store route for later use
        window.currentRoute = routeLine;
        window.currentClientMarker = clientMarker;
      } else {
        showRouteInfo('Route not found. Click "Get Directions" to open in navigation app.', false);
      }
    })
    .catch(error => {
      console.error('Routing error:', error);
      // Fallback: just show both markers
      const bounds = L.latLngBounds(
        [fromLocation.lat, fromLocation.lng],
        [toLocation.lat, toLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
      showRouteInfo('Route calculation failed. Click "Get Directions" for navigation.', false);
    });
}

// ============================================
// SHOW ROUTE INFO
// ============================================
function showRouteInfo(message, isSuccess, routeInfo = null) {
  // Use modal routeInfo (main view routeInfo removed)
  const routeInfoEl = document.getElementById('routeInfoModal');
  if (!routeInfoEl) return;
  
  routeInfoEl.style.display = 'block';
  
  if (routeInfo) {
    routeInfoEl.innerHTML = `
      <strong>📍 Route Information</strong>
      <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <span style="color: var(--text-secondary, #666); font-size: 0.9rem;">Distance:</span>
          <div style="font-weight: 600; color: var(--text-primary, #333);">${routeInfo.distance} km</div>
        </div>
        <div>
          <span style="color: var(--text-secondary, #666); font-size: 0.9rem;">Estimated Time:</span>
          <div style="font-weight: 600; color: var(--text-primary, #333);">~${routeInfo.duration} min</div>
        </div>
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color, #ddd);">
        <small style="color: var(--text-muted, #999);">${message}</small>
      </div>
    `;
  } else {
    routeInfoEl.innerHTML = `
      <strong>📍 Location Information</strong>
      <div style="margin-top: 8px;">
        <small style="color: var(--text-${isSuccess ? 'primary' : 'secondary'}, ${isSuccess ? '#333' : '#666'});">${message}</small>
      </div>
    `;
  }
}

// ============================================
// STEP 4: GET DIRECTIONS (using OpenStreetMap)
// ============================================
async function getDirectionsToApartment() {
  const location = window.currentApartmentLocation;
  if (!location) {
    alert('Location not available');
    return;
  }

  // Try to get client's current location for better routing
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const fromLat = position.coords.latitude;
        const fromLng = position.coords.longitude;
        // Open OpenStreetMap routing with both locations
        const osmUrl = `https://www.openstreetmap.org/directions?from=${fromLat},${fromLng}&to=${location.lat},${location.lng}`;
        window.open(osmUrl, '_blank');
      },
      () => {
        // If location access denied, just open with destination
        const osmUrl = `https://www.openstreetmap.org/directions?to=${location.lat},${location.lng}`;
        window.open(osmUrl, '_blank');
      }
    );
  } else {
    // Fallback: just open with destination
    const osmUrl = `https://www.openstreetmap.org/directions?to=${location.lat},${location.lng}`;
    window.open(osmUrl, '_blank');
  }
}

// ============================================
// HELPER: Search address using Nominatim (free)
// ============================================
function searchAddress(query, callback) {
  // Use Nominatim (free OpenStreetMap geocoding service)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  
  fetch(url, {
    headers: {
      'User-Agent': 'Apartrent App' // Required by Nominatim
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        const result = data[0];
        const location = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        callback(location, result.display_name);
      } else {
        callback(null, null);
      }
    })
    .catch(error => {
      console.error('Geocoding error:', error);
      callback(null, null);
    });
}

// ============================================
// HELPER: Convert coordinates to address (reverse geocoding)
// Improved accuracy with multiple attempts and better formatting
// ============================================
function getAddressFromCoordinates(location, retryCount = 0) {
  // Use Nominatim reverse geocoding with optimized parameters for better accuracy
  // zoom=18 provides street-level detail, addressdetails=1 gives structured data
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1&namedetails=1&extratags=1`;
  
  fetch(url, {
    headers: {
      'User-Agent': 'Apartrent App', // Required by Nominatim
      'Accept-Language': 'en' // Request English language results
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      let address = '';
      
      if (data && data.address) {
        // Build address from structured components with better logic
        const addr = data.address;
        let addressParts = [];
        
        // Build address in proper order: Street Number + Street Name, then area details
        if (addr.house_number) {
          addressParts.push(addr.house_number);
        }
        if (addr.road || addr.street || addr.pedestrian) {
          addressParts.push(addr.road || addr.street || addr.pedestrian);
        }
        
        // Add locality/neighborhood
        if (addr.suburb || addr.neighbourhood || addr.village || addr.hamlet) {
          addressParts.push(addr.suburb || addr.neighbourhood || addr.village || addr.hamlet);
        }
        
        // Add city/town
        if (addr.city || addr.town || addr.municipality) {
          addressParts.push(addr.city || addr.town || addr.municipality);
        }
        
        // Add state/province
        if (addr.state || addr.province || addr.region) {
          addressParts.push(addr.state || addr.province || addr.region);
        }
        
        // Add postcode
        if (addr.postcode) {
          addressParts.push(addr.postcode);
        }
        
        // Add country (usually not needed but can be included)
        // if (addr.country) {
        //   addressParts.push(addr.country);
        // }
        
        // Join address parts
        if (addressParts.length > 0) {
          address = addressParts.join(', ');
        }
      }
      
      // If structured address is empty or too short, try display_name
      if (!address || address.length < 5) {
        if (data && data.display_name) {
          // Clean up display_name - remove country if it's too long
          let displayName = data.display_name;
          // Remove country code at the end if present
          displayName = displayName.replace(/, [A-Z]{2}$/, '');
          address = displayName;
        }
      }
      
      // Final fallback - use coordinates
      if (!address || address.length < 3) {
        address = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      }
      
      window.tempMapAddress = address;
      
      // Update search input in modal
      const searchInput = document.getElementById('mapLocationSearchModal');
      if (searchInput) searchInput.value = address;
      
      // Update location input field
      const ctx = window.__mapPickerContext === 'new' ? 'new' : (window.__mapPickerContext === 'edit' ? 'edit' : null);
      const locationInput = ctx === 'new'
        ? document.getElementById('newAdLocation')
        : (ctx === 'edit'
          ? document.getElementById('adLocation')
          : (document.getElementById('newAdLocation') || document.getElementById('adLocation')));
      if (locationInput) locationInput.value = address;
    })
    .catch(error => {
      console.error('Reverse geocoding error:', error);
      
      // Retry once with a slight delay if first attempt failed
      if (retryCount === 0) {
        setTimeout(() => {
          getAddressFromCoordinates(location, 1);
        }, 500);
        return;
      }
      
      // Final fallback: show coordinates
      const address = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      window.tempMapAddress = address;
      
      const ctx = window.__mapPickerContext === 'new' ? 'new' : (window.__mapPickerContext === 'edit' ? 'edit' : null);
      const locationInput = ctx === 'new'
        ? document.getElementById('newAdLocation')
        : (ctx === 'edit'
          ? document.getElementById('adLocation')
          : (document.getElementById('newAdLocation') || document.getElementById('adLocation')));
      if (locationInput) {
        locationInput.value = address;
      }
      
      const searchInput = document.getElementById('mapLocationSearchModal');
      if (searchInput) searchInput.value = '';
    });
}

// ============================================
// MODAL FUNCTIONS FOR MAP PICKER
// ============================================
function openMapPickerModal(context = null) {
  const modal = document.getElementById('mapPickerModal');
  if (!modal) return;
  
  // Track which form invoked the picker so we don't overwrite other apartments/forms.
  // context: 'new' (Advertise) | 'edit' (Dashboard) | null (fallback)
  window.__mapPickerContext = (context === 'new' || context === 'edit') ? context : null;

  modal.style.display = 'flex';
  modal.classList.add('show');
  
  // Initialize map in modal after a short delay
  setTimeout(() => {
    const container = document.getElementById('landlordMapPickerModal');
    if (container) {
      // Clear previous map if exists
      if (modalMapInstance) {
        modalMapInstance.remove();
        modalMapInstance = null;
        container.innerHTML = '';
      }
      
      // Get existing location if any
      const ctx = window.__mapPickerContext === 'new' ? 'new' : (window.__mapPickerContext === 'edit' ? 'edit' : null);
      const lat = ctx === 'new'
        ? document.getElementById('newApartmentLatitude')?.value
        : (ctx === 'edit'
          ? document.getElementById('apartmentLatitude')?.value
          : (document.getElementById('newApartmentLatitude')?.value || document.getElementById('apartmentLatitude')?.value));
      const lng = ctx === 'new'
        ? document.getElementById('newApartmentLongitude')?.value
        : (ctx === 'edit'
          ? document.getElementById('apartmentLongitude')?.value
          : (document.getElementById('newApartmentLongitude')?.value || document.getElementById('apartmentLongitude')?.value));
      
      const initialLocation = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
      
      // Default search hint for new listings (don't override existing pins)
      if (!initialLocation) {
        const searchInput = document.getElementById('mapLocationSearchModal');
        if (searchInput && !String(searchInput.value || '').trim()) {
          searchInput.value = 'Paniqui, Tarlac, 2307';
        }
      }
      
      initLandlordMapPicker(container, initialLocation, (location) => {
        window.tempMapLocation = location;
      }).then(map => {
        modalMapInstance = map;
      }).catch(err => {
        console.error('Error initializing map in modal:', err);
      });
    }
  }, 300);
}

function closeMapPickerModal() {
  const modal = document.getElementById('mapPickerModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
    window.tempMapLocation = null;
    window.tempMapAddress = null;
    window.__mapPickerContext = null;
  }
}

function confirmMapLocation() {
  if (window.tempMapLocation) {
    const location = window.tempMapLocation;
    
    const ctx = window.__mapPickerContext === 'new' ? 'new' : (window.__mapPickerContext === 'edit' ? 'edit' : null);

    // Save to hidden inputs (ONLY the form that opened the picker)
    const newLatInput = document.getElementById('newApartmentLatitude');
    const newLngInput = document.getElementById('newApartmentLongitude');
    const editLatInput = document.getElementById('apartmentLatitude');
    const editLngInput = document.getElementById('apartmentLongitude');
    
    // Save to new ad form (with high precision - 6 decimal places)
    if (ctx === 'new' && newLatInput) {
      newLatInput.value = location.lat.toFixed(6);
      console.log('✅ Saved latitude to newApartmentLatitude:', location.lat.toFixed(6));
    }
    if (ctx === 'new' && newLngInput) {
      newLngInput.value = location.lng.toFixed(6);
      console.log('✅ Saved longitude to newApartmentLongitude:', location.lng.toFixed(6));
    }
    
    // Save to edit form (with high precision - 6 decimal places)
    if (ctx === 'edit' && editLatInput) {
      editLatInput.value = location.lat.toFixed(6);
      console.log('✅ Saved latitude to apartmentLatitude:', location.lat.toFixed(6));
    }
    if (ctx === 'edit' && editLngInput) {
      editLngInput.value = location.lng.toFixed(6);
      console.log('✅ Saved longitude to apartmentLongitude:', location.lng.toFixed(6));
    }
    
    // Update location text input (ONLY the form that opened the picker)
    const newLocationInput = document.getElementById('newAdLocation');
    const editLocationInput = document.getElementById('adLocation');
    
    if (window.tempMapAddress) {
      if (ctx === 'new' && newLocationInput) {
        newLocationInput.value = window.tempMapAddress;
        console.log('✅ Updated newAdLocation:', window.tempMapAddress);
      }
      if (ctx === 'edit' && editLocationInput) {
        editLocationInput.value = window.tempMapAddress;
        console.log('✅ Updated adLocation:', window.tempMapAddress);
      }
    }
    
    // Show confirmation message
    console.log('✅ Location confirmed and saved:', location);
    
    // Visual feedback - show a brief success message
    const modal = document.getElementById('mapPickerModal');
    if (modal) {
      const successMsg = document.createElement('div');
      successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10001; display: flex; align-items: center; gap: 8px;';
      successMsg.innerHTML = '<i class="fa-solid fa-check-circle"></i> Location saved! Click "Update Property" to save changes.';
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        successMsg.style.opacity = '0';
        successMsg.style.transition = 'opacity 0.3s ease';
        setTimeout(() => successMsg.remove(), 300);
      }, 3000);
    }
    
    closeMapPickerModal();
  } else {
    alert('Please select a location on the map first.');
  }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
window.LeafletMapsIntegration = {
  initLandlordMapPicker,
  initClientMapViewer,
  getDirectionsToApartment
};

// Make functions globally available
window.getDirectionsToApartment = getDirectionsToApartment;
window.closeDirectionsModal = () => {
  const modal = document.getElementById('directionsModal');
  if (modal) modal.style.display = 'none';
};
window.openMapPickerModal = openMapPickerModal;
window.closeMapPickerModal = closeMapPickerModal;
window.confirmMapLocation = confirmMapLocation;
// Note: openMapViewerModal and closeMapViewerModal are defined in client.js

// Modal only closes via X button or Cancel button - no click-outside or Escape key

