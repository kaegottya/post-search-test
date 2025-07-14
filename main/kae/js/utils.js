// Shared utility functions
$(document).ready(function() {
    console.log('🛠️ Utils module loaded');
});

// Alert system
function showAlert(message, type) {
    console.log(`🚨 Alert (${type}):`, message);

    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    $('body').append(alertHtml);

    setTimeout(function() {
        $('.alert').alert('close');
    }, 4000);
}

// HTML escape function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions
function convertToCSV(data) {
    const BOM = '\uFEFF'; // BOM for proper UTF-8 encoding in Excel
    const header = 'PSC;Adresa\n';
    const rows = data.map(item => `"${item.psc}";"${item.adresa}"`).join('\n');
    return BOM + header + rows;
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType + ';charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// API helper with extended timeout for large datasets
function makeSearchRequest(requestData) {
    console.log('📡 Making API request:', requestData);

    // Extended timeout for large dataset exports
    const timeout = requestData.perPage > 1000 ? 120000 : 30000; // 2 minutes for large requests

    return $.ajax({
        url: '../php/get_postboxes.php',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        timeout: timeout
    });
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70
            }, 1000);
        }
    });
}