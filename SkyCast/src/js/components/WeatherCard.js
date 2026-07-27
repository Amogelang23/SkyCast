export const WeatherCard = (Data ) => {
    const { temp, condition, high, low } = Data;

    return `
    <div class="weather-hero-content animate-fade-in">
        <div class="location-header">
        <h1 class="text-step-2">${location.city}, ${location.country}</h1>
        <p class="text-muted">${new Date().toLocaleDateString('eng-US', {weekday: 'long', month: 'long', day: 'numeric'})}</p>
    </div>
    <div class=temperature-display>
    <span class="temp-value text-huge">${Math.round(temp)}&deg;</span>
    <span class="condition-text">${condition.text}</span>
    </div>
    <div class="high-low">
    <span>H: ${Math.round(high)}&deg;</span>
    <span>L: ${Math.round(low)}&deg;</span>
    </div>
    </div>
    `;
}