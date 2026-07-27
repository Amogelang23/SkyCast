import { fetchWeather } from './api/weather.js';
import { WeatherCard } from './components/WeatherCard.js';
import { SearchController } from './components/SearchController.js';
import { getFontAwesomeIcon } from './utils/iconMap.js';
// Add Firebase imports
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config.js';

class App {
    constructor() {
        this.state = {
            weather: null,
            theme: localStorage.getItem('theme') || 'dark',
            currentUser: null // Track logged in user
        };
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.setTheme(this.state.theme);
        
        // Initialize Search
        this.searchController = new SearchController(this.loadDashboard.bind(this));
        
        // Check Auth State
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.state.currentUser = user;
                // Fetch user's default city from DB or default to London
                await this.loadDashboard('London'); 
            } else {
                // If not logged in, just load a default city
                await this.loadDashboard('London');
            }
        });
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
        container.classList.add('is-loading'); 
        
        const data = await fetchWeather(city);
        
        if (data) {
            this.state.weather = data;
            container.classList.remove('is-loading');
            
            // 1. Inject Hero Card
            container.innerHTML = WeatherCard(data);
            
            // 2. Bind the new Favorite Button
            this.bindFavoriteButton(data.location.city, data.location.country);
            
            // 3. Update Background Layer
            const condition = data.current.conditionMain.toLowerCase();
            let bgType = 'clear-day';
            if (condition === 'rain' || condition === 'drizzle') bgType = 'rain';
            if (condition === 'clouds') bgType = 'clouds';
            document.getElementById('weather-bg-layer').setAttribute('data-weather', bgType);

            // 4. Update Widgets (Using your existing OWM updateWidgets logic)
            this.updateWidgets(data.widgets);
        } else {
            container.classList.remove('is-loading');
            container.innerHTML = `<p class="error text-center mt-md">Data unavailable for ${city}.</p>`;
        }
    }

    async bindFavoriteButton(city, country) {
        const btn = document.getElementById('btn-dashboard-favorite');
        if (!btn || !this.state.currentUser) return; // Hide or disable if not logged in

        const icon = btn.querySelector('i');
        const favRef = collection(db, `users/${this.state.currentUser.uid}/favoriteLocations`);
        
        // Check if city is already in favorites
        const q = query(favRef, where("city", "==", city));
        const snapshot = await getDocs(q);
        let isFavorite = !snapshot.empty;
        let docId = isFavorite ? snapshot.docs[0].id : null;

        // Set initial icon state
        if (isFavorite) {
            icon.classList.replace('fa-regular', 'fa-solid');
            icon.style.color = '#f43f5e'; // Rose color for saved
        }

        // Handle Click
        btn.addEventListener('click', async () => {
            if (isFavorite) {
                // Remove from favorites
                await deleteDoc(snapshot.docs[0].ref);
                icon.classList.replace('fa-solid', 'fa-regular');
                icon.style.color = 'inherit';
                isFavorite = false;
            } else {
                // Add to favorites
                const docRef = await addDoc(favRef, {
                    city: city,
                    country: country,
                    addedAt: new Date()
                });
                icon.classList.replace('fa-regular', 'fa-solid');
                icon.style.color = '#f43f5e';
                isFavorite = true;
                docId = docRef.id;
            }
        });
    }

    updateWidgets(widgets) {
        // --- UV INDEX (Placeholder if using standard free OWM) ---
        const uvPercent = Math.min((widgets.uv / 11) * 100, 100);
        document.getElementById('uv-val').textContent = widgets.uv;
        document.getElementById('uv-indicator').style.left = `${uvPercent}%`;
        document.getElementById('uv-status-text').textContent = 'Moderate';

        // --- AIR QUALITY (OWM Index: 1 to 5) ---
        const aqiVal = widgets.aqi; 
        const aqiRing = document.querySelector('.ring-progress');
        const circumference = 251.2; 
        
        // Calculate dash offset based on 1-5 scale
        const aqiPercent = (aqiVal / 5); 
        aqiRing.style.strokeDashoffset = circumference - (aqiPercent * circumference);
        
        // Update Ring Color Class
        aqiRing.className.baseVal = 'ring-progress'; // reset
        if (aqiVal === 1) aqiRing.classList.add('aqi-good');
        else if (aqiVal === 2 || aqiVal === 3) aqiRing.classList.add('aqi-moderate');
        else aqiRing.classList.add('aqi-unhealthy');

        document.getElementById('aqi-val').textContent = aqiVal;
        
        const aqiLabels = {1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor'};
        document.getElementById('aqi-status-text').textContent = aqiLabels[aqiVal];

        const hourlyContainer = document.getElementById('hourly-forecast-container');
        hourlyContainer.innerHTML = ''; 
        
        widgets.hourly.forEach((hourBlock, index) => {
            const timeObj = new Date(hourBlock.dt * 1000);
            const timeStr = index === 0 ? 'Now' : timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const faClass = getFontAwesomeIcon(hourBlock.weather[0].icon);
            const pop = Math.round(hourBlock.pop * 100); 
            const rainHTML = pop > 20 ? `<span class="rain-chance">${pop}%</span>` : '';

            hourlyContainer.innerHTML += `
                <div class="hourly-item ${index === 0 ? 'active' : ''}">
                    <span class="time">${timeStr}</span>
                    <i class="${faClass}"></i>
                    <span class="temp">${Math.round(hourBlock.main.temp)}&deg;</span>
                    ${rainHTML}
                </div>
            `;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aeroApp = new App();
});