export const WeatherCard = (data) => {
    const dateString = new Date(data.location.localTime).toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric' 
    });

    return `
        <div class="weather-hero-content animate-fade-in">
            <div class="location-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h1 class="text-step-2">${data.location.city}, ${data.location.country}</h1>
                    <p class="text-muted">${dateString}</p>
                </div>
                <!-- The new Add to Favorites button -->
                <button id="btn-dashboard-favorite" class="btn-icon" data-city="${data.location.city}" data-country="${data.location.country}" aria-label="Save to locations">
                    <i class="fa-regular fa-heart fa-lg"></i>
                </button>
            </div>
            
            <div class="temperature-display">
                <i class="${data.current.faIcon} weather-hero-icon"></i>
                <span class="temp-value text-huge">${Math.round(data.current.temp)}&deg;</span>
                <span class="condition-text">${data.current.conditionText}</span>
            </div>
            
            <div class="high-low">
                <span>H: ${Math.round(data.current.high)}&deg;</span>
                <span>L: ${Math.round(data.current.low)}&deg;</span>
            </div>
        </div>
    `;
};