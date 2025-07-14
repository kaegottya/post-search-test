$(document).ready(function() {
    console.log('🏠 Home module loaded');

    initializeHomePage();

    function initializeHomePage() {
        loadStatistics();
        initializeSmoothScrolling();
        console.log('✅ Home page initialization complete');
    }

    // Load postbox count statistics from API
    function loadStatistics() {
        console.log('📊 Loading statistics...');

        makeSearchRequest({
            search: '',
            searchType: 'all',
            page: 1,
            perPage: 1
        })
            .done(function(response) {
                if (response.success && response.total) {
                    $('#totalPostboxes').text(response.total.toLocaleString('cs-CZ'));
                    console.log('✅ Statistics loaded:', response.total);
                } else {
                    $('#totalPostboxes').text('N/A');
                    console.warn('⚠️ Failed to load statistics');
                }
            })
            .fail(function() {
                $('#totalPostboxes').text('N/A');
                console.error('❌ Error loading statistics');
            });
    }
});