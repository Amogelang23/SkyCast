import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import { fetchWeather } from '../api/weather.js';

export class LocationsController {
    constructor() {
        this.currentUser = null;
        
        // DOM Elements
        this.container = document.getElementById('favorites-list');
        this.btnAddCity = document.getElementById('btn-add-city'); 

        this.init();
    }

    init() {
        // Guard the route: check if user is logged in
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                this.bindEvents();
                await this.loadLocations();
            } else {
                window.location.replace('/auth.html');
            }
        });
    }

    bindEvents() {
        // For now, we'll use a simple browser prompt to get the city name.
        // You can later connect this to a custom modal or your SearchController.
        this.btnAddCity.addEventListener('click', async () => {
            const city = prompt("Enter a city name to add to your favorites:");
            if (city && city.trim() !== '') {
                await this.addCity(city.trim());
            }
        });
    }

    async loadLocations() {
        this.container.innerHTML = `<div class="text-center w-100 text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading saved locations...</div>`;
        
        try {
            // 1. Fetch saved cities from Firestore
            const favRef = collection(db, `users/${this.currentUser.uid}/favoriteLocations`);
            const q = query(favRef, orderBy('addedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                this.container.innerHTML = `
                    <div class="text-center w-100 text-muted" style="grid-column: 1 / -1; padding: 2rem;">
                        <i class="fa-solid fa-map-location-dot fa-3x" style="opacity: 0.5; margin-bottom: 1rem;"></i>
                        <p>You haven't saved any locations yet.</p>
                    </div>`;
                return;
            }

            this.container.innerHTML = ''; // Clear loading state

            // 2. Fetch live OWM weather data for each city concurrently
            const weatherPromises = querySnapshot.docs.map(async (docSnapshot) => {
                const dbData = docSnapshot.data();
                const weatherData = await fetchWeather(dbData.city);
                
                return {
                    docId: docSnapshot.id,
                    weather: weatherData
                };
            });

            const locationsData = await Promise.all(weatherPromises);

            // 3. Render the cards
            locationsData.forEach(item => {
                if (item.weather) {
                    this.renderCard(item.docId, item.weather);
                }
            });

            // 4. Attach event listeners to the newly injected HTML
            this.bindCardEvents();

        } catch (error) {
            console.error("Failed to load locations:", error);
            this.container.innerHTML = `<p class="error text-center" style="color: #f87171;">Failed to load locations.</p>`;
        }
    }

    renderCard(docId, data) {
        // Map OWM AQI (1-5) to text
        const aqiLabels = {1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor'};
        const aqiText = aqiLabels[data.widgets.aqi] || 'Unknown';

        // Calculate wind speed (assuming metric m/s from OWM, convert to km/h)
        // Note: OWM metric returns m/s. 1 m/s = 3.6 km/h. 
        // If your fetchWeather returns km/h already, adjust this.
        const windSpeed = 12; // Placeholder if wind isn't in your standardized object yet

        const cardHTML = `
            <article class="location-card glass-panel" data-expanded="false" data-id="${docId}">
                <div class="card-summary" role="button" aria-expanded="false" tabindex="0">
                    <div class="city-info">
                        <h2>${data.location.city}</h2>
                        <span class="text-muted">${data.location.country}</span>
                    </div>
                    <div class="temp-info" style="display: flex; align-items: center; gap: 12px;">
                        <i class="${data.current.faIcon} text-step-1"></i>
                        <span class="text-step-2">${Math.round(data.current.temp)}&deg;</span>
                    </div>
                </div>

                <div class="card-details-wrapper">
                    <div class="card-details-inner">
                        <hr class="glass-divider">
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="label text-muted">High/Low</span>
                                <strong>${Math.round(data.current.high)}&deg; / ${Math.round(data.current.low)}&deg;</strong>
                            </div>
                            <div class="detail-item">
                                <span class="label text-muted">Condition</span>
                                <strong style="text-transform: capitalize;">${data.current.conditionMain}</strong>
                            </div>
                            <div class="detail-item">
                                <span class="label text-muted">AQI</span>
                                <strong>${aqiText}</strong>
                            </div>
                        </div>
                        <div class="card-actions" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
                            <button class="btn-icon btn-share" aria-label="Share">
                                <i class="fa-solid fa-share-nodes"></i>
                            </button>
                            <button class="btn-icon danger btn-delete" aria-label="Remove" style="color: #f87171;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;

        this.container.insertAdjacentHTML('beforeend', cardHTML);
    }

    bindCardEvents() {
        // Expand/Collapse Logic (Replacing the old locations.js logic)
        const summaryHeaders = this.container.querySelectorAll('.card-summary');
        summaryHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const parentCard = e.currentTarget.closest('.location-card');
                const isExpanded = parentCard.getAttribute('data-expanded') === 'true';
                
                // Toggle state
                parentCard.setAttribute('data-expanded', !isExpanded);
                e.currentTarget.setAttribute('aria-expanded', !isExpanded);
            });
        });

        // Delete Logic
        const deleteButtons = this.container.querySelectorAll('.btn-delete');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // Prevent the click from bubbling up and expanding the card
                e.stopPropagation(); 
                
                const card = e.currentTarget.closest('.location-card');
                const docId = card.getAttribute('data-id');
                
                if (confirm("Remove this city from your saved locations?")) {
                    await this.deleteCity(docId, card);
                }
            });
        });
    }

    async addCity(cityName) {
        try {
            // First, verify the city exists by fetching weather data
            const weather = await fetchWeather(cityName);
            if (!weather) {
                alert("City not found. Please try again.");
                return;
            }

            // Save to Firestore
            const favRef = collection(db, `users/${this.currentUser.uid}/favoriteLocations`);
            await addDoc(favRef, {
                city: weather.location.city,
                country: weather.location.country,
                addedAt: new Date()
            });

            // Reload the grid to show the new city
            await this.loadLocations();
        } catch (error) {
            console.error("Error adding city:", error);
            alert("Failed to save location.");
        }
    }

    async deleteCity(docId, cardElement) {
        try {
            cardElement.style.opacity = '0.5';
            cardElement.style.pointerEvents = 'none';

            const docRef = doc(db, `users/${this.currentUser.uid}/favoriteLocations`, docId);
            await deleteDoc(docRef);

            cardElement.remove();

            if (this.container.children.length === 0) {
                this.loadLocations(); 
            }
        } catch (error) {
            console.error("Error deleting city:", error);
            alert("Failed to remove location.");
            cardElement.style.opacity = '1';
            cardElement.style.pointerEvents = 'auto';
        }
    }
}