// JS pro search funkcionalitu. Tady jsem si tady od claude nechal dost poradit, předtím jsem dělal hlavně discord.js (kde to je hodně jinak a bylo to hlavně spojený s Discordem, takže tam to prostě bylo úplně jinak.
// Důvod, proč se sem rozepisuju je ten, že je prakticky úplně jedno, jestli to sem napíšu nebo ne a raději budu upřímný v tom, k čemu všemu jsem využívál LLM, protože stejně půjde poznat, co přesně jsem dělal "ručně" já a co ne.)
// Šlo mi hlavně o to, udělat to co nejlépe, správně nastavit sqlko (což mi zabralo asi hodinu a půl protože se můj počítač po poslední zkušenosti s postgresql dost cukal) a udělat i kvalitní UI. co půjde řádně podchytit)
// Příjemný čtení přeji :)
$(document).ready(function() {
    console.log('🔍 Search module loaded');

    let currentResults = [];
    let currentPage = 1;
    let totalPages = 1;
    let isLoading = false;

    initializeSearch();

    function initializeSearch() {
        console.log('🔧 Initializing search functionality');

        // Kontrola, zda-li všechno funguje jak má
        if (!validateSearchElements()) {
            console.error('❌ Required search elements not found!');
            return;
        }
        setupSearchEventListeners();

        console.log('✅ Search initialization complete');
    }

    function validateSearchElements() {
        const requiredElements = [
            '#mainSearchInput',
            '#mainSearchBtn',
            '#searchType',
            '#perPage',
            '#clearResults',
            '#resultsTable',
            '#pagination'
        ];

        return requiredElements.every(selector => {
            const exists = $(selector).length > 0;
            if (!exists) {
                console.error(`❌ Element ${selector} not found!`);
            }
            return exists;
        });
    }

    function setupSearchEventListeners() {
        // Search button kliknutí
        $('#mainSearchBtn').click(performSearch);

        $('#mainSearchInput').keypress(function(e) {
            if (e.which === 13) {
                performSearch();
            }
        });

        // Změna search options
        $('#searchType, #perPage').change(function() {
            const searchTerm = $('#mainSearchInput').val().trim();
            if (searchTerm) {
                performSearch();
            }
        });

        // Výmaz parametrů
        $('#clearResults').click(clearResults);

        $(document).on('click', '.page-link', function(e) {
            e.preventDefault();
            const page = parseInt($(this).data('page'));
            if (page && page !== currentPage && !isLoading) {
                currentPage = page;
                performSearch();
            }
        });

        // Exportování .csv souboru
        $('#exportCurrentPage').click(() => exportCurrentPage(currentResults, currentPage));
        $('#exportAllResults').click(() => exportAllResults()); // exportování 100 výsledků

        // Shortcuts
        $(document).on('keydown', function(e) {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                $('#mainSearchInput').focus();
            }
            if (e.key === 'Escape') {
                clearResults();
            }
        });
    }

    function performSearch() {
        if (isLoading) {
            console.log('⏳ Search already in progress');
            return;
        }

        // Získání parametrů
        const searchTerm = $('#mainSearchInput').val().trim();
        const searchType = $('#searchType').val() || 'all';
        const perPage = parseInt($('#perPage').val()) || 25;

        // Validace
        if (!searchTerm) {
            showAlert('Zadejte prosím hledaný výraz', 'warning');
            return;
        }

        isLoading = true;
        setLoadingState(true);

        // Vytvoření requestu
        const requestData = {
            search: searchTerm,
            searchType: searchType,
            page: currentPage,
            perPage: perPage
        };

        makeSearchRequest(requestData)
            .done(function(response) {
                handleSearchSuccess(response);
            })
            .fail(function(xhr, status, error) {
                handleSearchError(xhr, status, error);
            })
            .always(function() {
                isLoading = false;
                setLoadingState(false);
            });
    }

    function handleSearchSuccess(response) {
        console.log('✅ Search successful:', response);

        if (response && response.success) {
            currentResults = response.data || [];
            totalPages = response.totalPages || 1;

            displayResults(response);
            buildPagination(response);
        } else {
            showAlert('Chyba při vyhledávání: ' + (response ? response.error : 'Neznámá chyba'), 'danger');
            showEmptyState();
        }
    }

    function handleSearchError(xhr, status, error) {
        console.error('❌ Search error:', { status, error, statusCode: xhr.status });

        let errorMessage = 'Chyba při vyhledávání';
        if (status === 'timeout') {
            errorMessage = 'Časový limit vypršel. Zkuste to prosím znovu.';
        } else if (xhr.status === 404) {
            errorMessage = 'API endpoint nenalezen.';
        } else if (xhr.status === 500) {
            errorMessage = 'Chyba serveru.';
        }

        showAlert(errorMessage, 'danger');
        showEmptyState();
    }

    // Render search výsledků pro zobrazení
    function displayResults(response) {
        const tbody = $('#resultsTable tbody');
        tbody.empty();

        if (!response.data || response.data.length === 0) {
            showEmptyState();
            return;
        }

        response.data.forEach(function(item) {
            const row = $(`
                <tr class="result-row">
                    <td>
                        <span class="badge bg-primary">${escapeHtml(item.psc)}</span>
                    </td>
                    <td>
                        <i class="bi bi-geo-alt text-muted me-2"></i>
                        ${escapeHtml(item.adresa)}
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary map-btn" 
                                data-address="${escapeHtml(item.adresa)}" 
                                data-psc="${escapeHtml(item.psc)}">
                            <i class="bi bi-map"></i> Mapa
                        </button>
                    </td>
                </tr>
            `);
            tbody.append(row);
        });

        $('#resultCount').text(`${response.showing} z ${response.total} výsledků`);
        hideEmptyState();
    }

    // Stránkování komponentů
    // Vybere to odpověď jako parametr, které obsahuje informace stránkování z odpovědi serveru
    function buildPagination(response) {
        const pagination = $('#pagination');
        pagination.empty();

        if (response.totalPages <= 1) {
            $('#paginationContainer').hide();
            return;
        }

        $('#paginationContainer').show();

        // Previous button
        if (response.page > 1) {
            pagination.append(`
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${response.page - 1}">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
            `);
        }

        // Čísla stránek
        const startPage = Math.max(1, response.page - 2);
        const endPage = Math.min(response.totalPages, response.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === response.page ? 'active' : '';
            pagination.append(`
                <li class="page-item ${isActive}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }

        // Další tlačítka
        if (response.page < response.totalPages) {
            pagination.append(`
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${response.page + 1}">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            `);
        }
    }

    // Reset do původního stavu -> clear result
    function clearResults() {
        $('#mainSearchInput').val('');
        $('#searchType').val('all');
        $('#perPage').val('25');

        currentResults = [];
        currentPage = 1;
        totalPages = 1;

        $('#resultsTable tbody').empty();
        $('#resultCount').text('0 výsledků');
        $('#pagination').empty();

        showEmptyState();
        $('#mainSearchInput').focus();
        showAlert('Výsledky byly vymazány', 'success');
    }

    // Loading state
    function setLoadingState(loading) {
        if (loading) {
            $('#mainSearchBtn').prop('disabled', true).html('<i class="bi bi-hourglass-split"></i> Hledám...');
            $('#loadingState').removeClass('d-none');
            $('#emptyState').addClass('d-none');
            $('#resultsTable').parent().hide();
            $('#paginationContainer').hide();
        } else {
            $('#mainSearchBtn').prop('disabled', false).html('<i class="bi bi-search"></i> Hledat');
            $('#loadingState').addClass('d-none');
            $('#resultsTable').parent().show();
        }
    }

    function showEmptyState() {
        $('#emptyState').removeClass('d-none');
        $('#resultsTable').parent().hide();
        $('#paginationContainer').hide();
    }

    function hideEmptyState() {
        $('#emptyState').addClass('d-none');
        $('#resultsTable').parent().show();
    }

    // Export .csv
    function exportCurrentPage(results, page) {
        if (results.length === 0) {
            showAlert('Žádné výsledky k exportu', 'warning');
            return;
        }

        const csv = convertToCSV(results);
        const filename = `postovni_schranky_strana_${page}.csv`;
        downloadFile(csv, filename, 'text/csv');
        showAlert(`Stránka ${page} byla exportována`, 'success');
    }

    // Export .csv
    function exportAllResults() {
        const searchTerm = $('#mainSearchInput').val().trim();
        if (!searchTerm) {
            showAlert('Nejprve proveďte vyhledávání', 'warning');
            return;
        }

        showAlert('Exportuji všechny výsledky...', 'info');

        makeSearchRequest({
            search: searchTerm,
            searchType: $('#searchType').val() || 'all',
            page: 1,
            perPage: 10000
        })
            .done(function(response) {
                if (response.success) {
                    const csv = convertToCSV(response.data);
                    downloadFile(csv, 'postovni_schranky_vsechny_vysledky.csv', 'text/csv');
                    showAlert(`Exportováno ${response.data.length} výsledků`, 'success');
                } else {
                    showAlert('Chyba při exportu: ' + response.error, 'danger');
                }
            })
            .fail(function() {
                showAlert('Chyba při exportu všech výsledků', 'danger');
            });
    }
});