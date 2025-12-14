// DOM Elements
const listPays = document.getElementById('side');
const searchInput = document.getElementById('search-input');
const searchResultsCount = document.getElementById('search-results-count');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const errorClose = document.getElementById('error-close');
const loadingIndicator = document.getElementById('loading-indicator');
const contentDiv = document.getElementById('content');

// State
let allCountries = [];
let filteredCountries = [];
let currentChart = null;
let selectedCountryCode = null;

// Initialize chart
function initChart() {
    const cnv = document.createElement('canvas');
    cnv.setAttribute('id', 'myChart');
    contentDiv.innerHTML = '';
    contentDiv.appendChild(cnv);

    const ctx = document.getElementById('myChart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'COVID-19 Statistics',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#333'
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cases'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });

    return currentChart;
}

// Display error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    console.error('Error:', message);
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Show loading indicator
function showLoading() {
    loadingIndicator.style.display = 'flex';
}

// Hide loading indicator
function hideLoading() {
    loadingIndicator.style.display = 'none';
}

// Update chart with COVID data
function updateChart(countries, data) {
    if (!data || data.length === 0) {
        showError('No data available for this country.');
        return;
    }

    try {
        const dates = [];
        const confirmed = [];
        const deaths = [];
        const recovered = [];
        const active = [];

        data.forEach((record) => {
            const dateStr = record.Date.toString();
            dates.push(dateStr.slice(8, 10) + '/' + dateStr.slice(5, 7));
            confirmed.push(record.Confirmed || 0);
            deaths.push(record.Deaths || 0);
            recovered.push(record.Recovered || 0);
            active.push(record.Active || 0);
        });

        const countryName = data[0].Country || 'Unknown Country';

        const datasets = [
            {
                label: 'Confirmed Cases',
                data: confirmed,
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5
            },
            {
                label: 'Recovered Cases',
                data: recovered,
                borderColor: '#388e3c',
                backgroundColor: 'rgba(56, 142, 60, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5
            },
            {
                label: 'Deaths',
                data: deaths,
                borderColor: '#d32f2f',
                backgroundColor: 'rgba(211, 47, 47, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5
            },
            {
                label: 'Active Cases',
                data: active,
                borderColor: '#f57c00',
                backgroundColor: 'rgba(245, 124, 0, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5
            }
        ];

        currentChart.data.labels = dates;
        currentChart.data.datasets = datasets;
        currentChart.options.plugins.title.text = countryName + ' - COVID-19 Statistics';
        currentChart.update();
        hideError();
    } catch (error) {
        showError('Error updating chart: ' + error.message);
    }
}

// Fetch country data and update chart
function onCountryClicked(countryCode) {
    if (!countryCode) return;

    selectedCountryCode = countryCode;
    updateActiveButton();
    showLoading();

    try {
        // Find country name from code
        const country = allCountries.find(c => c.countryInfo.iso2 === countryCode);
        if (!country) {
            hideLoading();
            showError('Country not found.');
            return;
        }

        const countryName = country.country;
        fetch('https://disease.sh/v3/covid-19/historical/' + countryName + '?lastdays=all')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.status);
                }
                return response.json();
            })
            .then((data) => {
                formatAndUpdateChart(countryName, data);
                hideLoading();
            })
            .catch((error) => {
                hideLoading();
                showError('Failed to fetch data for this country. ' + error.message);
            });
    } catch (error) {
        hideLoading();
        showError('Error: ' + error.message);
    }
}

// Format disease.sh data and update chart
function formatAndUpdateChart(countryName, data) {
    if (!data || !data.timeline || !data.timeline.cases) {
        showError('No data available for this country.');
        return;
    }

    try {
        const timeline = data.timeline;
        const dates = [];
        const confirmed = [];
        const deaths = [];
        const recovered = [];

        // Convert object to arrays
        const caseEntries = Object.entries(timeline.cases);
        caseEntries.forEach(([date, cases]) => {
            const [month, day, year] = date.split('/');
            dates.push(day + '/' + month);
            confirmed.push(cases || 0);
            deaths.push(timeline.deaths[date] || 0);
            recovered.push(timeline.recovered[date] || 0);
        });

        // Calculate active cases
        const active = [];
        for (let i = 0; i < confirmed.length; i++) {
            active.push(Math.max(0, confirmed[i] - deaths[i] - recovered[i]));
        }

        const datasets = [
            {
                label: 'Confirmed Cases',
                data: confirmed,
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5
            },
            {
                label: 'Recovered Cases',
                data: recovered,
                borderColor: '#388e3c',
                backgroundColor: 'rgba(56, 142, 60, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5
            },
            {
                label: 'Deaths',
                data: deaths,
                borderColor: '#d32f2f',
                backgroundColor: 'rgba(211, 47, 47, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5
            },
            {
                label: 'Active Cases',
                data: active,
                borderColor: '#f57c00',
                backgroundColor: 'rgba(245, 124, 0, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5
            }
        ];

        currentChart.data.labels = dates;
        currentChart.data.datasets = datasets;
        currentChart.options.plugins.title.text = countryName + ' - COVID-19 Statistics';
        currentChart.update();
        hideError();
    } catch (error) {
        showError('Error updating chart: ' + error.message);
    }
}

// Update active button styling
function updateActiveButton() {
    document.querySelectorAll('#side div').forEach((btn) => {
        if (btn.getAttribute('id') === selectedCountryCode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Filter countries based on search input
function filterCountries() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    document.querySelectorAll('#side div').forEach((countryBtn) => {
        const countryName = countryBtn.textContent.toLowerCase();
        if (searchTerm === '' || countryName.includes(searchTerm)) {
            countryBtn.classList.remove('hidden');
        } else {
            countryBtn.classList.add('hidden');
        }
    });

    // Update results count
    const visibleCount = document.querySelectorAll('#side div:not(.hidden)').length;
    if (searchTerm) {
        searchResultsCount.textContent = `${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
    } else {
        searchResultsCount.textContent = '';
    }
}

// Fetch and populate countries list
function loadCountries() {
    showLoading();

    try {
        fetch('https://disease.sh/v3/covid-19/countries')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.status);
                }
                return response.json();
            })
            .then((data) => {
                if (!Array.isArray(data)) {
                    throw new Error('Unexpected data format');
                }

                // Sort by country name
                allCountries = data.sort((a, b) => a.country.localeCompare(b.country));

                // Clear existing countries
                listPays.innerHTML = '';

                // Add countries to list
                allCountries.forEach((country) => {
                    const countryBtn = document.createElement('div');
                    countryBtn.setAttribute('id', country.countryInfo.iso2);
                    countryBtn.setAttribute('role', 'button');
                    countryBtn.setAttribute('tabindex', '0');
                    countryBtn.setAttribute('aria-label', 'View data for ' + country.country);
                    countryBtn.textContent = country.country;

                    // Click event
                    countryBtn.addEventListener('click', () => {
                        onCountryClicked(country.countryInfo.iso2);
                    });

                    // Keyboard support
                    countryBtn.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onCountryClicked(country.countryInfo.iso2);
                        }
                    });

                    listPays.appendChild(countryBtn);
                });

                hideLoading();

                // Load default country (Morocco)
                onCountryClicked('MA');
                hideError();
            })
            .catch((error) => {
                hideLoading();
                showError('Failed to load countries: ' + error.message);
            });
    } catch (error) {
        hideLoading();
        showError('Error: ' + error.message);
    }
}

// Event listeners
searchInput.addEventListener('input', filterCountries);
errorClose.addEventListener('click', hideError);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideError();
    }
});

// Initialize app
initChart();
loadCountries();
