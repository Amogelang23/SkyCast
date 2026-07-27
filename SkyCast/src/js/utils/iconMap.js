/**
 * Maps OpenWeatherMap icon codes to Font Awesome classes.
 * @param {string} iconCode - OWM code (e.g., '01d', '10n')
 */
export const getFontAwesomeIcon = (iconCode) => {
    const iconMapping = {
        '01d': 'fa-solid fa-sun',                 
        '01n': 'fa-solid fa-moon',                
        '02d': 'fa-solid fa-cloud-sun',           
        '02n': 'fa-solid fa-cloud-moon',          
        '03d': 'fa-solid fa-cloud',              
        '03n': 'fa-solid fa-cloud',
        '04d': 'fa-solid fa-cloud',              
        '04n': 'fa-solid fa-cloud',
        '09d': 'fa-solid fa-cloud-showers-heavy', 
        '09n': 'fa-solid fa-cloud-showers-heavy',
        '10d': 'fa-solid fa-cloud-sun-rain',      
        '10n': 'fa-solid fa-cloud-moon-rain',     
        '11d': 'fa-solid fa-cloud-bolt',         
        '11n': 'fa-solid fa-cloud-bolt',
        '13d': 'fa-solid fa-snowflake',          
        '13n': 'fa-solid fa-snowflake',
        '50d': 'fa-solid fa-smog',               
        '50n': 'fa-solid fa-smog'
    };

    return iconMapping[iconCode] || 'fa-solid fa-cloud';
};