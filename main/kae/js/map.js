// Map module for handling map modal functionality
$(document).ready(function() {
    console.log('🗺️ Map module loaded');

    // Initialize map modal events
    initializeMapModal();

    function initializeMapModal() {
        // Handle map button clicks
        $(document).on('click', '.map-btn', function() {
            const address = $(this).data('address');
            const psc = $(this).data('psc');
            console.log('🗺️ Map button clicked:', psc, address);
            showMapModal(address, psc);
        });

        // External map buttons
        $('#openGoogleMapsBtn').click(function() {
            if (window.mapModule && window.mapModule.currentGoogleQuery) {
                const googleUrl = `https://www.google.com/maps/search/?api=1&query=${window.mapModule.currentGoogleQuery}`;
                console.log('🌐 Opening Google Maps:', googleUrl);
                window.open(googleUrl, '_blank');
            }
        });

        $('#openMapyCzBtn').click(function() {
            if (window.mapModule && window.mapModule.currentMapyCzQuery) {
                const mapyCzUrl = `https://mapy.cz/zakladni?q=${window.mapModule.currentMapyCzQuery}`;
                console.log('🌐 Opening Mapy.cz:', mapyCzUrl);
                window.open(mapyCzUrl, '_blank');
            }
        });

        // Clear modal when closed
        $('#mapModal').on('hidden.bs.modal', function() {
            if (window.mapModule && window.mapModule.currentMap) {
                window.mapModule.currentMap.remove();
                window.mapModule.currentMap = null;
            }
            $('#mapContainer').html('');
            if (window.mapModule) {
                window.mapModule.currentFullAddress = '';
                window.mapModule.currentGoogleQuery = '';
                window.mapModule.currentMapyCzQuery = '';
            }
        });
    }
});

// Global map module object
window.mapModule = {
    currentFullAddress: '',
    currentGoogleQuery: '',
    currentMapyCzQuery: '',
    currentMap: null
};

function showMapModal(address, psc) {
    console.log('🗺️ Opening map modal:', psc, address);

    window.mapModule.currentFullAddress = `${address}, ${psc}, Czech Republic`;
    window.mapModule.currentGoogleQuery = encodeURIComponent(window.mapModule.currentFullAddress);
    window.mapModule.currentMapyCzQuery = encodeURIComponent(`${address}, ${psc}`);

    $('#mapAddressTitle').text(`${psc} - ${address}`);

    // Create map container
    $('#mapContainer').html(`
        <div id="leafletMap" style="height: 100%; width: 100%; position: relative;">
            <div class="map-loading d-flex align-items-center justify-content-center h-100">
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Načítám mapu...</span>
                    </div>
                    <p class="mt-2 text-muted">Hledám polohu na mapě...</p>
                </div>
            </div>
        </div>
        <div class="position-absolute top-0 start-0 m-3 bg-white rounded p-2 shadow-sm" style="z-index: 1000;">
            <h6 class="mb-0">
                <i class="bi bi-geo-alt text-primary me-2"></i>
                ${escapeHtml(psc)} - ${escapeHtml(address)}
            </h6>
        </div>
    `);

    $('#mapModal').modal('show');

    // Initialize map after modal is shown
    setTimeout(() => {
        initializeLeafletMap(address, psc);
    }, 300);
}

function initializeLeafletMap(address, psc) {
    console.log('🗺️ Initializing Leaflet map for:', address);

    // Clear loading state
    $('#leafletMap .map-loading').remove();

    // Initialize map centered on Czech Republic
    const map = L.map('leafletMap').setView([49.7439, 15.3381], 7);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Store map reference
    window.mapModule.currentMap = map;

    // Try to geocode only the address
    geocodeAddress(address, psc, map);
}

function geocodeAddress(address, psc, map) {
    console.log('🔍 Geocoding address:', address);

    // Create search queries focusing on the address
    const queries = [
        `${address}, Czech Republic`,
        `${address}, Czechia`,
        `${address}, CZ`,
        `${address}`,
        `${address}, ${psc}, Czech Republic`,
        `${address}, ${psc}`
    ];

    tryGeocoding(queries, 0, map, address, psc);
}

function tryGeocoding(queries, index, map, address, psc) {
    if (index >= queries.length) {
        console.warn('⚠️ All geocoding attempts failed');
        showLocationNotFound(address, psc, map);
        return;
    }

    const query = queries[index];
    console.log(`🔍 Trying geocoding query ${index + 1}/${queries.length}:`, query);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cz&limit=5&addressdetails=1`;

    fetch(nominatimUrl, {
        headers: {
            'User-Agent': 'PostalBoxFinder/1.0 (contact@example.com)'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`📍 Geocoding response for query ${index + 1}:`, data);

            if (data && data.length > 0) {
                // Find the best match based on the address
                const bestMatch = findBestAddressMatch(data, address);

                if (bestMatch) {
                    const lat = parseFloat(bestMatch.lat);
                    const lon = parseFloat(bestMatch.lon);

                    if (lat && lon) {
                        console.log('✅ Geocoding successful:', lat, lon);
                        displayLocationOnMap(map, lat, lon, address, psc, bestMatch);
                        return;
                    }
                }
            }

            // If this attempt failed, try the next query
            setTimeout(() => {
                tryGeocoding(queries, index + 1, map, address, psc);
            }, 1000);
        })
        .catch(error => {
            console.error(`❌ Geocoding error for query ${index + 1}:`, error);

            // Try next query after a delay
            setTimeout(() => {
                tryGeocoding(queries, index + 1, map, address, psc);
            }, 1000);
        });
}

function findBestAddressMatch(results, address) {
    console.log('🎯 Finding best address match from results:', results);

    // Score each result based on address relevance
    const scoredResults = results.map(result => {
        let score = 0;
        const displayName = result.display_name.toLowerCase();
        const addressLower = address.toLowerCase();

        // Split address into parts for better matching
        const addressParts = addressLower.split(/[\s,]+/).filter(part => part.length > 1);

        // Check if address parts match
        addressParts.forEach(part => {
            if (displayName.includes(part)) {
                score += 20;
            }
        });

        // Prefer more specific results (street level)
        if (result.class === 'highway' || result.class === 'place') {
            score += 15;
        }

        // Prefer results with house numbers
        if (result.address && result.address.house_number) {
            score += 25;
        }

        // Prefer results with street names
        if (result.address && result.address.road) {
            score += 20;
        }

        // Higher importance = better match
        if (result.importance) {
            score += result.importance * 10;
        }

        return { ...result, score };
    });

    // Sort by score descending
    scoredResults.sort((a, b) => b.score - a.score);

    console.log('🎯 Scored results:', scoredResults.map(r => ({
        display_name: r.display_name,
        score: r.score,
        class: r.class,
        type: r.type
    })));

    // Return best match if it has a reasonable score
    return scoredResults[0] && scoredResults[0].score > 10 ? scoredResults[0] : null;
}

function displayLocationOnMap(map, lat, lon, address, psc, geocodingResult) {
    console.log('🗺️ Displaying location on map:', lat, lon);

    // Center map on found location
    map.setView([lat, lon], 16);

    // Add marker with detailed popup
    const marker = L.marker([lat, lon]).addTo(map);

    const popupContent = `
        <div class="text-center">
            <h6><i class="bi bi-mailbox2 text-primary"></i> Poštovní schránka</h6>
            <p class="mb-1"><strong>${psc}</strong></p>
            <p class="mb-2">${address}</p>
            ${geocodingResult.display_name ? `<p class="text-muted small">${geocodingResult.display_name}</p>` : ''}
            <div class="mt-2">
                <small class="text-success">
                    <i class="bi bi-check-circle"></i> Poloha nalezena
                </small>
            </div>
        </div>
    `;

    marker.bindPopup(popupContent).openPopup();

    // Add circle around the location
    L.circle([lat, lon], {
        color: '#28a745',
        fillColor: '#28a745',
        fillOpacity: 0.2,
        radius: 50
    }).addTo(map);

    // Add accuracy indicator if available
    if (geocodingResult.boundingbox) {
        const bounds = geocodingResult.boundingbox;
        const southwest = L.latLng(bounds[0], bounds[2]);
        const northeast = L.latLng(bounds[1], bounds[3]);
        L.rectangle(L.latLngBounds(southwest, northeast), {
            color: '#007bff',
            fillColor: '#007bff',
            fillOpacity: 0.1,
            weight: 1
        }).addTo(map);
    }
}

function showLocationNotFound(address, psc, map) {
    console.log('❌ Location not found for:', address);

    // Default to center of Czech Republic
    map.setView([49.7439, 15.3381], 7);

    const marker = L.marker([49.7439, 15.3381]).addTo(map);
    marker.bindPopup(`
        <div class="text-center">
            <h6><i class="bi bi-exclamation-triangle text-danger"></i> Poloha nenalezena</h6>
            <p class="mb-1">PSČ: <strong>${psc}</strong></p>
            <p class="mb-2">${address}</p>
            <div class="mt-2">
                <small class="text-muted">
                    Adresa nebyla nalezena v mapových datech
                </small>
            </div>
            <hr class="my-2">
            <div class="d-flex justify-content-center gap-2">
                <small class="text-info">
                    <i class="bi bi-info-circle"></i> Zkuste externí mapy
                </small>
            </div>
        </div>
    `).openPopup();

    // Add a general area indicator
    L.circle([49.7439, 15.3381], {
        color: '#dc3545',
        fillColor: '#dc3545',
        fillOpacity: 0.1,
        radius: 50000
    }).addTo(map);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showAlert('Adresa zkopírována do schránky', 'success');
    }).catch(function() {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert('Adresa zkopírována do schránky', 'success');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}