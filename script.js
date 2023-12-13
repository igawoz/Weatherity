'use strict';
const logo = document.querySelector('.logo');
const cityInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');
const searchCurLocationBtn = document.querySelector('.cur-position-btn');
const currentWeather = document.querySelector('.current-details');
const forecastCards = document.querySelector('.forecast-cards');
const mapDiv = document.getElementById('map-display');
const DAYS_OF_WEEK = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];
const API_KEY = 'd2cb4706ec42af81835a3dac53cdff2a';

const getDayOfWeek = date => {
  const dayOfWeek = new Date(date).getDay();
  return isNaN(dayOfWeek) ? null : DAYS_OF_WEEK[dayOfWeek];
};

const generateCard = (cityName, forecast, i) => {
  const date = forecast.dt_txt.split(' ')[0];
  const temperature = Math.round(forecast.main.temp - 273.15).toFixed(0);
  if (i === 0) {
    return ` 
      <h2 class="city">${cityName.toUpperCase()}</h2>
      <h4 class="date">
        ${forecast.dt_txt.split(' ')[0]} <br />
        ${getDayOfWeek(date)}
      </h4>
      <h2 class="temp">${temperature}°C <img src="img/${
      forecast.weather[0].icon
    }.png" /></h2>
      <h4 class="description">${forecast.weather[0].main.toUpperCase()}</h4>
      <ul class="additional-details">
        <li><img src="img/humidity.png" />Humidity: ${
          forecast.main.humidity
        }%</li>
        <li><img src="img/propability.png" />Propability: ${
          forecast.pop * 100
        } %</li>
        <li><img src="img/wind.png" />Wind: ${forecast.wind.speed} m/s</li>
        <li><img src="img/pressure.png" />Pressure: ${
          forecast.main.pressure
        } hPa</li>
        
      </ul>`;
  } else {
    return `
  <li class="card">
    <h4>
      ${forecast.dt_txt.split(' ')[0]} <br />
      ${getDayOfWeek(date)}
    </h4>
    <div class="separator-line-card"></div>
    <h3>${temperature}°C</h3>
    <img src="img/${forecast.weather[0].icon}.png" />
    <h4 class="description-card">${forecast.weather[0].main.toUpperCase()}</h4>
    <h4 class="additional-details-card">Humidity: ${
      forecast.main.humidity
    }%</h4>
    <h4 class="additional-details-card">Wind: ${forecast.wind.speed} m/s</h4>
  </li>`;
  }
};

const getWeatherData = (cityName, latitude, longitude) => {
  const weatherAPIURL = `http://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

  fetch(weatherAPIURL)
    .then(res => res.json())
    .then(data => {
      const singleDailyForecasts = [];
      const fiveDaysForecast = data.list.filter(forecast => {
        const forecastDate = new Date(forecast.dt_txt).getDate();
        const forecastHour = new Date(forecast.dt_txt).getHours();
        if (
          forecastDate &&
          forecastHour === 12 &&
          !singleDailyForecasts.includes(forecastDate)
        ) {
          return singleDailyForecasts.push(forecastDate);
        }
      });

      fiveDaysForecast.unshift(data.list[0]);

      // map

      cityInput.value = '';
      currentWeather.innerHTML = '';
      forecastCards.innerHTML = '';

      console.log(fiveDaysForecast);

      fiveDaysForecast.forEach((forecast, i) => {
        if (i === 0) {
          currentWeather.insertAdjacentHTML(
            'beforeend',
            generateCard(cityName, forecast, i)
          );
        } else {
          forecastCards.insertAdjacentHTML(
            'beforeend',
            generateCard(cityName, forecast, i)
          );
        }
      });
    })
    .catch(() => {
      alert('Error occured while fetching weather forecast.');
    });
};

let map = null;

const generateMap = (latitude, longitude) => {
  if (!map) {
    map = L.map('map-display').setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    searchCurLocationBtn.onclick = () => {
      if (map) {
        map.remove();
        map = null;
      }
    };

    searchBtn.onclick = () => {
      if (map) {
        map.remove();
        map = null;
      }
    };

    cityInput.addEventListener('keydown', k => {
      if (k.key === 'Enter' && map) {
        map.remove();
        map = null;
      }
    });
  } else {
    map.setView([latitude, longitude], 13);
  }
};

// ONCHANGE

// $('.klasa_buttona').prop('disable', true);

const getCityCoords = () => {
  const cityName = cityInput.value.trim().replace(' ', '-');
  if (!cityName) return;
  console.log(cityName);

  const geocodingAPIURL = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=5&appid=${API_KEY}`;

  fetch(geocodingAPIURL)
    .then(res => {
      if (!res.ok) {
        throw new Error('City not found');
      }
      return res.json();
    })
    .then(data => {
      if (!data.length) {
        return alert(`Sorry, We couldn't find coordinates for ${cityName}.`);
      }
      const { name, lat: latitude, lon: longitude } = data[0];
      console.log(data[0]);

      getWeatherData(name, latitude, longitude);
      generateMap(latitude, longitude);
    })
    .catch(error => {
      alert(error.message || 'Error occurred while fetching coordinates.');
    });

  console.log(geocodingAPIURL);
};

const getUserCoords = () => {
  if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        const ReverseGeoCodingURL = `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
        fetch(ReverseGeoCodingURL)
          .then(res => res.json())
          .then(data => {
            const { name } = data[0];
            getWeatherData(name, latitude, longitude);
          })
          .catch(() => {
            alert(
              'Error occured while fetching the city while using geolocation.'
            );
          });
        generateMap(latitude, longitude);
      },

      error => {
        alert(
          `We couldn't find your geolocation. Make sure you allowed your browser to get your location.`
        );
      }
    );
};

searchBtn.addEventListener('click', getCityCoords);
cityInput.addEventListener(
  'keydown',
  k => k.key === 'Enter' && getCityCoords()
);
searchCurLocationBtn.addEventListener('click', getUserCoords);
