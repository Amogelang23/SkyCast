import { fetchWeather } from './api/weather.js';
import { WeatherCard } from './components/WeatherCard.js';
import { SearchController } from './components/SearchController.js';
// import { auth, db } from './firebase/config.js'; // Uncomment when Auth UI is connected

class App {
    constructor() {
        this.state = {
            weather: null,
            theme: localStorage.getItem('theme') || 'dark',
            units: 'metric'
        };
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.setTheme(this.state.theme);
        
        this.searchController = new SearchController(this.loadDashboard.bind(this));
        
        await this.loadDashboard('London'); 
    }

    bindEvents() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    }

    setTheme(theme) {
        this.state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    async loadDashboard(city) {
        const container = document.getElementById('current-weather');
        
        // 1. Add the loading state class
        container.classList.add('is-loading');
        
        // 2. Fetch the data
        const data = await fetchWeather(city);
        
        if (data) {
            // 3. Update application state
            this.state.weather = data;
            
            // 4. Remove loading state and inject UI
            container.classList.remove('is-loading');
            container.innerHTML = WeatherCard(data);
            
            // 5. Update the atmospheric background animation
            document.getElementById('weather-bg-layer').setAttribute('data-weather', data.condition.type || 'clear-day');
            
        } else {
            // 6. Handle errors cleanly
            container.classList.remove('is-loading');
            container.innerHTML = `<p class="error text-center mt-md">Failed to load weather data for ${city}.</p>`;
        }
    }
}

// Boot the app
document.addEventListener('DOMContentLoaded', () => {
    window.aeroApp = new App();
});