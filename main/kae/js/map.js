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

        $('#openOsmBtn').click(function() {
            if (window.mapModule && window.mapModule.currentOsmQuery) {
                const osmUrl = `https://www.openstreetmap.org/search?query=${window.mapModule.currentOsmQuery}`;
                console.log('🌐 Opening OpenStreetMap:', osmUrl);
                window.open(osmUrl, '_blank');
            }
        });

        // Clear modal when closed
        $('#mapModal').on('hidden.bs.modal', function() {
            $('#mapContainer').html('');
            if (window.mapModule) {
                window.mapModule.currentFullAddress = '';
                window.mapModule.currentGoogleQuery = '';
                window.mapModule.currentMapyCzQuery = '';
                window.mapModule.currentOsmQuery = '';
            }
        });
    }
});

// Global map module object
window.mapModule = {
    currentFullAddress: '',
    currentGoogleQuery: '',
    currentMapyCzQuery: '',
    currentOsmQuery: ''
};

function showMapModal(address, psc) {
    console.log('🗺️ Opening map modal:', psc, address);

    window.mapModule.currentFullAddress = `${address}, ${psc}, Czech Republic`;
    window.mapModule.currentGoogleQuery = encodeURIComponent(window.mapModule.currentFullAddress);
    window.mapModule.currentMapyCzQuery = encodeURIComponent(`${address}, ${psc}`);
    window.mapModule.currentOsmQuery = encodeURIComponent(window.mapModule.currentFullAddress);

    $('#mapAddressTitle').text(`${psc} - ${address}`);

    // Show address bar and instruction for opening map
    $('#mapContainer').html(`
        <div class="d-flex align-items-center justify-content-center h-100 bg-light">
            <div class="text-center">
                <div class="mb-4">
                    <i class="bi bi-geo-alt display-1 text-primary"></i>
                </div>
                <h3 class="mb-3">${escapeHtml(psc)} - ${escapeHtml(address)}</h3>
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    Použijte tlačítka níže pro otevření mapy v novém okně
                </div>
                <div class="address-bar bg-white p-3 rounded border mt-3">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="bi bi-geo-alt"></i>
                        </span>
                        <input type="text" class="form-control" value="${escapeHtml(window.mapModule.currentFullAddress)}" readonly>
                        <button class="btn btn-outline-secondary" type="button" onclick="copyToClipboard('${escapeHtml(window.mapModule.currentFullAddress)}')">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `);

    $('#mapModal').modal('show');
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