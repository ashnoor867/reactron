const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const GEO_API_URL = 'https://api.openweathermap.org/geo/1.0/direct';
console.log('Weather App initialized');
console.log('API Key available:', !!API_KEY);

// DOM Elements
const cityInput = document.getElementById('city');
const searchBtn = document.getElementById('search');
const locationBtn = document.getElementById('location');
const cityDisplay = document.getElementById('city-display');
const tempElement = document.getElementById('temp');
const feelsElement = document.getElementById('feels');
const minmaxElement = document.getElementById('minmax');
const descElement = document.getElementById('desc');
const humidElement = document.getElementById('humid');
const windElement = document.getElementById('wind');
const directionElement = document.getElementById('direction');
const pressureElement = document.getElementById('pressure');
const visibleElement = document.getElementById('visible');
const sunTimeElement = document.getElementById('sun-time');
const weatherIcon = document.getElementById('icon');
const darkBtn = document.getElementById('darkBtn');
const weatherBox = document.getElementById('weather-box');
const cityList = document.getElementById('city-list');
console.log('DOM elements loaded');

// Theme Management
const currentTheme = localStorage.getItem('theme') || 'light';
document.body.className = `${currentTheme}-theme`;
console.log('Theme set to:', currentTheme);

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    console.log('Search button clicked for city:', city);
    if (city) {
        getWeatherByCity(city);
        cityInput.blur();
    } else {
        console.warn('No city entered');
        showToast('Please enter a city name');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherByCity(city);
            cityInput.blur();
        } else {
            showToast('Please enter a city name');
        }
    }
});

cityInput.addEventListener('input', debounce(function() {
    const query = this.value.trim();
    console.log('Input detected:', query);
    if (query.length >= 3) {
        fetchCitySuggestions(query);
    } else {
        cityList.innerHTML = '';
        cityList.classList.add('hide');
    }
}, 300));

locationBtn.addEventListener('click', () => {
    console.log('Location button clicked');
    showLoading();
    if (navigator.geolocation) {
        console.log('Requesting geolocation...');
        navigator.geolocation.getCurrentPosition(
            position => {
                console.log('Geolocation received:', position.coords.latitude, position.coords.longitude);
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                console.error('Geolocation error:', error);
                console.log('Falling back to IP-based geolocation');
                getLocationByIP();
            }
        );
    } else {
        console.error('Geolocation not supported by this browser');
        getLocationByIP();
    }
});

darkBtn.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.className = `${newTheme}-theme`;
    localStorage.setItem('theme', newTheme);
    console.log(`Theme switched to ${newTheme} mode`);
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !cityList.contains(e.target)) {
        cityList.classList.add('hide');
    }
});

// Utility Functions
function debounce(func, delay) {
    let timer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(context, args), delay);
    };
}

function showLoading() {
    searchBtn.disabled = true;
    locationBtn.disabled = true;
    searchBtn.textContent = 'Loading...';
    cityInput.disabled = true;
}

function hideLoading() {
    searchBtn.disabled = false;
    locationBtn.disabled = false;
    searchBtn.textContent = 'Search';
    cityInput.disabled = false;
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutes} ${ampm}`;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.backgroundColor = document.body.classList.contains('dark-theme') ? '#333' : '#f0f0f0';
    toast.style.color = document.body.classList.contains('dark-theme') ? '#fff' : '#333';
    toast.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    toast.style.zIndex = '1000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }, 100);
}

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// API Functions
async function fetchCitySuggestions(query) {
    try {
        const url = `${GEO_API_URL}?q=${query}&limit=5&appid=${API_KEY}`;
        console.log('Fetching city suggestions for:', query);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            displaySuggestions(data);
        } else {
            cityList.innerHTML = '';
            cityList.classList.add('hide');
        }
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
    }
}

function displaySuggestions(cities) {
    cityList.innerHTML = '';
    
    cities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;
        
        item.addEventListener('click', () => {
            cityInput.value = city.name;
            cityList.classList.add('hide');
            getWeatherByCoords(city.lat, city.lon);
        });
        
        cityList.appendChild(item);
    });
    
    cityList.classList.remove('hide');
}

async function getWeatherByCity(city) {
    console.log(`Fetching weather for city: ${city}`);
    showLoading();
    try {
        const url = `${API_BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`;
        console.log('API request URL:', url.replace(API_KEY, 'API_KEY_HIDDEN'));
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch weather data');
        }
        
        const data = await response.json();
        console.log('Weather data received:', data);
        updateWeatherUI(data);
    } catch (error) {
        console.error('Error fetching weather by city:', error);
        showToast(`Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function getWeatherByCoords(lat, lon) {
    console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);
    showLoading();
    try {
        const url = `${API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        console.log('API request URL:', url.replace(API_KEY, 'API_KEY_HIDDEN'));
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch weather data');
        }
        
        const data = await response.json();
        console.log('Weather data received:', data);
        updateWeatherUI(data);
    } catch (error) {
        console.error('Error fetching weather by coordinates:', error);
        showToast(`Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function getLocationByIP() {
    try {
        console.log('Fetching location by IP address');
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        console.log('IP geolocation data:', data);
        if (data.latitude && data.longitude) {
            getWeatherByCoords(data.latitude, data.longitude);
        } else {
            console.error('IP geolocation failed to return coordinates');
            showToast('Failed to detect your location');
            hideLoading();
        }
    } catch (error) {
        console.error('Error fetching location by IP:', error);
        showToast('Failed to detect your location');
        hideLoading();
    }
}

function updateWeatherUI(data) {
    console.log('Updating UI with weather data');
    
    // Update location
    cityDisplay.textContent = `${data.name}, ${data.sys.country}`;
    
    // Update temperature and related info
    tempElement.textContent = `${Math.round(data.main.temp)}°C`;
    feelsElement.textContent = `Feels like: ${Math.round(data.main.feels_like)}°C`;
    minmaxElement.textContent = `Min: ${Math.round(data.main.temp_min)}°C / Max: ${Math.round(data.main.temp_max)}°C`;
    
    // Update description and icon
    descElement.textContent = data.weather[0].description;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    weatherIcon.alt = data.weather[0].description;
    
    // Update other weather details
    humidElement.textContent = `Humidity: ${data.main.humidity}%`;
    windElement.textContent = `Wind: ${data.wind.speed} m/s`;
    directionElement.textContent = `Direction: ${getWindDirection(data.wind.deg)} (${data.wind.deg}°)`;
    pressureElement.textContent = `Pressure: ${data.main.pressure} hPa`;
    
    // Calculate visibility in km with one decimal place
    const visibilityKm = (data.visibility / 1000).toFixed(1);
    visibleElement.textContent = `Visibility: ${visibilityKm} km`;
    
    // Update sunrise and sunset
    const sunrise = formatTime(data.sys.sunrise);
    const sunset = formatTime(data.sys.sunset);
    sunTimeElement.textContent = `Sunrise: ${sunrise} / Sunset: ${sunset}`;
    
    // Show the weather card
    weatherBox.classList.remove('hide');
    
    // Animation effect
    weatherBox.style.animation = 'none';
    weatherBox.offsetHeight; // Trigger reflow
    weatherBox.style.animation = null;
    
    console.log('UI updated successfully');
    hideLoading();
    
    // Change background based on weather condition
    setBackgroundByWeatherCondition(data.weather[0].id);
}

function setBackgroundByWeatherCondition(weatherId) {
    // Remove any existing background classes
    const possibleBackgrounds = [
        'thunderstorm-bg', 'drizzle-bg', 'rain-bg', 
        'snow-bg', 'atmosphere-bg', 'clear-bg', 'clouds-bg'
    ];
    
    document.body.classList.remove(...possibleBackgrounds);
    
    // Add the appropriate class based on weather condition
    if (weatherId >= 200 && weatherId < 300) {
        document.body.classList.add('thunderstorm-bg');
    } else if (weatherId >= 300 && weatherId < 500) {
        document.body.classList.add('drizzle-bg');
    } else if (weatherId >= 500 && weatherId < 600) {
        document.body.classList.add('rain-bg');
    } else if (weatherId >= 600 && weatherId < 700) {
        document.body.classList.add('snow-bg');
    } else if (weatherId >= 700 && weatherId < 800) {
        document.body.classList.add('atmosphere-bg');
    } else if (weatherId === 800) {
        document.body.classList.add('clear-bg');/
    } else if (weatherId > 800) {
        document.body.classList.add('clouds-bg');
    }
}

// Initialize the app - try to get user location
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, attempting initial geolocation');
    showLoading();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                console.log('Initial geolocation received');
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                console.error('Initial geolocation error:', error);
                console.log('Falling back to IP-based geolocation');
                getLocationByIP();
            },
            { timeout: 5000 } // Set a 5-second timeout for geolocation
        );
    } else {
        console.error('Geolocation not supported');
        getLocationByIP();
    }
});