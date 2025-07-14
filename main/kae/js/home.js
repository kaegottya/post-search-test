$(document).ready(function() {
    console.log('🏠 Home module loaded');

    // Initialize home page functionality
    initializeHomePage();

    function initializeHomePage() {
        // Load statistics
        loadStatistics();

        // Initialize smooth scrolling
        initializeSmoothScrolling();

        console.log('✅ Home page initialization complete');
    }

    function loadStatistics() {
        console.log('📊 Loading statistics...');

        // Get total count of postboxes
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