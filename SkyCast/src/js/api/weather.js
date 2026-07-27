import { getFontAwesomeIcon } from '../utils/iconMap.js';

const API_KEY = '013456e5c41fe8c107a0748e2e135977';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const fetchWeather = async (city) => {
    try {
        const currentRes = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
        if (!currentRes.ok) throw new Error('City not found');
        const current = await currentRes.json();
        
        const lat = current.coord.lat;
        const lon = current.coord.lon;

        const [forecastRes, aqiRes] = await Promise.all([
            fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
            fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        ]);

        const forecast = await forecastRes.json();
        const aqiData = await aqiRes.json();

        return {
            location: {
                city: current.name,
                country: current.sys.country,
                localTime: new Date().getTime()
            },
            current: {
                temp: current.main.temp,
                conditionText: current.weather[0].description,
                conditionMain: current.weather[0].main,
                faIcon: getFontAwesomeIcon(current.weather[0].icon),
                high: current.main.temp_max,
                low: current.main.temp_min
            },
            widgets: {
                aqi: aqiData.list[0].main.aqi, 
                hourly: forecast.list.slice(0, 8), 
            }
        };
    } catch (error) {
        console.error("OpenWeatherMap Fetch Error:", error);
        return null;
    }
};