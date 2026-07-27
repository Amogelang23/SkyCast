import { debounce } from '../utils/debounce.js';
import { searchLocations } from '../api/weather.js';

export class SearchController {
    constructor(onLocationSelect) {
        this.input = document.getElementById('location-search');
        this.resultsContainer = document.getElementById('search-results');
        
        // Callback to trigger the main app to load the new city
        this.onLocationSelect = onLocationSelect; 
        
        this.recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        
        this.init();
    }

    init() {
        // Debounce the API call so it doesn't fire on every keystroke
        const debouncedSearch = debounce((query) => this.performSearch(query), 400);

        // Event Listeners
        this.input.addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));
        
        this.input.addEventListener('focus', () => {
            if (this.input.value.trim() === '') {
                this.renderRecentSearches();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    async performSearch(query) {
        if (query.length < 2) {
            this.renderRecentSearches();
            return;
        }

        const results = await searchLocations(query);
        this.renderResults(results);
    }

    renderResults(results) {
        this.resultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            this.resultsContainer.innerHTML = `<div class="search-item text-muted">No locations found</div>`;
        } else {
            results.forEach(loc => {
                const item = document.createElement('div');
                item.className = 'search-item';
                item.innerHTML = `
                    <span class="icon-map-pin"></span>
                    <div class="loc-details">
                        <span class="loc-name">${loc.name}</span>
                        <span class="loc-region text-muted">${loc.region ? loc.region + ', ' : ''}${loc.country}</span>
                    </div>
                `;
                
                item.addEventListener('click', () => this.selectLocation(loc.name));
                this.resultsContainer.appendChild(item);
            });
        }
        
        this.openDropdown();
    }

    renderRecentSearches() {
        this.resultsContainer.innerHTML = '';
        
        if (this.recentSearches.length === 0) return;

        const header = document.createElement('div');
        header.className = 'search-header text-muted';
        header.textContent = 'Recent Searches';
        this.resultsContainer.appendChild(header);

        this.recentSearches.forEach(city => {
            const item = document.createElement('div');
            item.className = 'search-item recent';
            item.innerHTML = `
                <span class="icon-clock"></span>
                <span class="loc-name">${city}</span>
            `;
            
            item.addEventListener('click', () => this.selectLocation(city));
            this.resultsContainer.appendChild(item);
        });

        this.openDropdown();
    }

    selectLocation(cityName) {
        this.input.value = cityName;
        this.closeDropdown();
        this.saveToHistory(cityName);
        
        // Trigger the main app update
        if (this.onLocationSelect) {
            this.onLocationSelect(cityName);
        }
    }

    saveToHistory(cityName) {
        this.recentSearches = this.recentSearches.filter(city => city.toLowerCase() !== cityName.toLowerCase());
        
        this.recentSearches.unshift(cityName);
        
        if (this.recentSearches.length > 5) {
            this.recentSearches.pop();
        }
        
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    }

    openDropdown() {
        this.resultsContainer.classList.remove('hidden');
    }

    closeDropdown() {
        this.resultsContainer.classList.add('hidden');
    }
}