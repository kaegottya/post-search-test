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
    currentMapyCzQuery: ''
};

function showMapModal(address, psc) {
    console.log('🗺️ Opening map modal:', psc, address);

    window.mapModule.currentFullAddress = `${address}, ${psc}, Czech Republic`;
    window.mapModule.currentGoogleQuery = encodeURIComponent(window.mapModule.currentFullAddress);
    window.mapModule.currentMapyCzQuery = encodeURIComponent(`${address}, ${psc}`);

    $('#mapAddressTitle').text(`${psc} - ${address}`);

    // Create OpenStreetMap iframe (no API key needed)
    const osmQuery = encodeURIComponent(`${address}, ${psc}, Czech Republic`);
    const osmUrl = `https://www.openstreetmap.org/search?query=${osmQuery}`;

    $('#mapContainer').html(`
        <div class="position-relative h-100">
            <iframe 
                src="${osmUrl}" 
                width="100%" 
                height="100%" 
                style="border:0;" 
                allowfullscreen="" 
                loading="lazy">
            </iframe>
            <div class="position-absolute top-0 start-0 m-3">
                <div class="bg-white rounded p-2 shadow-sm">
                    <h6 class="mb-0">
                        <i class="bi bi-geo-alt text-primary me-2"></i>
                        ${escapeHtml(psc)} - ${escapeHtml(address)}
                    </h6>
                </div>
            </div>
        </div>
    `);

    $('#mapModal').modal('show');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}