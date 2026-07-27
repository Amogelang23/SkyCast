const API_KEY = 'c8dac9a7eb5b8eeca15ee0e2ce133413';
const BASE_URL = 'https://api.weatherapi.com/v1';

export const fetchWeather = async (query) => {
    try {
        const response = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${query}&days=7&aqi=yes`);
        if (!response.ok) throw new Error('Weather data unavailable');
        
        const rawData = await response.json();
        return normalizeWeatherData(rawData);
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};

export const searchLocations = async (query) => {
    if (!query || query.length < 2) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/search.json?key=${API_KEY}&q=${query}`);
        if (!response.ok) throw new Error('Search failed');
        
        return await response.json(); 
        // Returns array of { id, name, region, country, lat, lon }
    } catch (error) {
        console.error("Autocomplete Error:", error);
        return [];
    }
};

const normalizeWeatherData = (data) => ({
    location: { city: data.location.name, country: data.location.country },
    temp: data.current.temp_c,
    condition: { text: data.current.condition.text, icon: data.current.condition.icon },
    high: data.forecast.forecastday[0].day.maxtemp_c,
    low: data.forecast.forecastday[0].day.mintemp_c,
    aqi: data.current.air_quality['us-epa-index'],
    uv: data.current.uv
});