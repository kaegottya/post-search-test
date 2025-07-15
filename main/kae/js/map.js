// Modul pro zobrazení mapy
$(document).ready(function() {
    console.log('🗺️ Map module loaded');

    initializeMapModal();

    function initializeMapModal() {
        // Tohle řeší klikání na mapu
        $(document).on('click', '.map-btn', function() {
            const address = $(this).data('address');
            const psc = $(this).data('psc');
            console.log('🗺️ Map button clicked:', psc, address);
            showMapModal(address, psc);
        });

        // Ext. buttons (Google maps, Mapy.cz. Jdou přidat i další tlačítka, ale pak se kompletně rozhodí stylizace. Doporučuju spíš měnit, co je tam aktuálně)
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

        // Tohle vyčistí "cache" aby se pak ta mapa načetla správně při kliknutí na jinej button
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

    // Vytvoří container pro mapu + styling
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
        <div class="position-absolute top-0 start-0 m-3 rounded p-2 shadow-sm map-overlay-bg" style="z-index: 1000;">
            <h6 class="mb-0">
                <i class="bi bi-geo-alt text-primary me-2"></i>
                ${escapeHtml(psc)} - ${escapeHtml(address)}
            </h6>
        </div>
    `);

    $('#mapModal').modal('show');

    // Inicializace mapy po načtení
    setTimeout(() => {
        initializeLeafletMap(address, psc);
    }, 300);
}

function initializeLeafletMap(address, psc) {
    console.log('🗺️ Initializing Leaflet map for:', address);

    $('#leafletMap .map-loading').remove();

    const map = L.map('leafletMap').setView([49.7439, 15.3381], 7);


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    window.mapModule.currentMap = map;

    geocodeAddress(address, psc, map);
}

function geocodeAddress(address, psc, map) {
    console.log('🔍 Geocoding address:', address);

    // Vyhledávací querries pro adresu
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
                // Najde nejlepší shodu na základě adresy. Protože PSČ v .csv je špatně (problém český pošty), adresa se bere pro mapu z sloupce pro adresu.
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

            // Fallback když selže hledání
            setTimeout(() => {
                tryGeocoding(queries, index + 1, map, address, psc);
            }, 1000);
        })
        .catch(error => {
            console.error(`❌ Geocoding error for query ${index + 1}:`, error);


            setTimeout(() => {
                tryGeocoding(queries, index + 1, map, address, psc);
            }, 1000);
        });
}

function findBestAddressMatch(results, address) {
    console.log('🎯 Finding best address match from results:', results);

    // Skóre podle relevance (všechno přidává body do finální hodnoty podle který se vybere ta nejbližší možná hodnota)
    const scoredResults = results.map(result => {
        let score = 0;
        const displayName = result.display_name.toLowerCase();
        const addressLower = address.toLowerCase();

        const addressParts = addressLower.split(/[\s,]+/).filter(part => part.length > 1);

        addressParts.forEach(part => {
            if (displayName.includes(part)) {
                score += 20;
            }
        });

        if (result.class === 'highway' || result.class === 'place') {
            score += 15;
        }

        if (result.address && result.address.house_number) {
            score += 25;
        }

        if (result.address && result.address.road) {
            score += 20;
        }

        if (result.importance) {
            score += result.importance * 10;
        }

        return { ...result, score };
    });

    // Seřazení výsledků podle bodů
    scoredResults.sort((a, b) => b.score - a.score);

    console.log('🎯 Scored results:', scoredResults.map(r => ({
        display_name: r.display_name,
        score: r.score,
        class: r.class,
        type: r.type
    })));

    // V praxi když nevychází úplná chujovina tak to vrátí hodnotu co to má zobrazit
    return scoredResults[0] && scoredResults[0].score > 10 ? scoredResults[0] : null;
}

function displayLocationOnMap(map, lat, lon, address, psc, geocodingResult) {
    console.log('🗺️ Displaying location on map:', lat, lon);

    // Vycentrování na lokaci
    map.setView([lat, lon], 16);

    // Přidání bodu na pozici ("špendlík")
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

    // Kolečko okolo bodu
    L.circle([lat, lon], {
        color: '#28a745',
        fillColor: '#28a745',
        fillOpacity: 0.2,
        radius: 50
    }).addTo(map);

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

    // Defaultně to je vycentrovaný na ČR když se nepodaří najít bod, který odpovídá. Děje se to hlavně u č.p., kde úplně není jak změnit vyhledávání (tried, failed) Externí mapy to řeší velmi dobře
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

// V týhle části mě neskutečně potahal Claude 4 Sonnet, měl jsem předtím funkční řešení, který ale přidáváním dalších věcí přestalo fungovat kvůli po-upu :)