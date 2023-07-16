// TO-DO: Implement local storage for saving search history to browser

// global variables
const searchBox = $(`#search-box`);
const searchBtn = $(`#search-btn`);
const historyContent = $(`.history`);
const mainContent = $(`#content`);

// api variables
const openWeatherMapRootUrl = 'https://api.openweathermap.org';
const openWeatherMapApiKey = '38d00f5de5ce24fe5aa235ca54fea8f2';

// an array of all successful weather location searches (ones returned data)
let searchHistory = [];

// this adds a button of the search that returned a successful response from the API to the '.search-history' div
const addHistory = (search) => {
  if (!searchHistory.includes(search)) {
    searchHistory.push(search);
    historyContent.append(`<button class="history-item btn btn-secondary" onclick="searchFormSubmit('${search}')">${search}</button>`);
    localStorage.setItem('searchHistoryStorage', JSON.stringify(searchHistory));
  }
}

// update searchHistory array with weather locations that have been previously saved in local storage
if(localStorage.getItem(`searchHistoryStorage`) !== null) {
  searchHistoryStorage = JSON.parse(localStorage.getItem(`searchHistoryStorage`));
  for (let i = 0; i < searchHistoryStorage.length; i++) {
    searchHistory.push(searchHistoryStorage[i]);
    addHistory(searchHistoryStorage[i]);
    historyContent.append(`<button class="history-item btn btn-secondary" onclick="searchFormSubmit('${searchHistoryStorage[i]}')">${searchHistoryStorage[i]}</button>`);
  }
}

const searchFormSubmit = (search) => {
  fetchCoords(search);
}

// preliminary step of fetching location coordinates so we can use them to fetch the weather
const fetchCoords = (search) => {
  let apiUrl = `${openWeatherMapRootUrl}/geo/1.0/direct?q=${search}&limit=5&appid=${openWeatherMapApiKey}`;

  fetch(apiUrl)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (!data[0]) {
        alert('Location not found');
      } else {
        addHistory(search);
        fetchWeather(data[0]);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

// fetches the weather with the previously fetched location coordinates
const fetchWeather = (coordsData) => {
  // api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API key}
  let lat = coordsData.lat;
  let lon = coordsData.lon;
  console.log(`latitude: ${lat}, longitude:${lon}`);
  let apiUrl = `${openWeatherMapRootUrl}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherMapApiKey}`;

  fetch(apiUrl)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      console.log(data);
      let fiveDayForecast = [];
      // The api provides 40 forecasts per 5 day period but we only want 1 per day (5 total).
      // This loop gets every 8th forecast from the 40 to make the 5 day forecast (fiveDayForecast) array.
      // this INCLUDES the current day forecast.
      for (let i = 0; i < 40; i += 8) {
        fiveDayForecast.push(data.list[i])
      }
      // add the last day of the forecast to the list (day 6 -> last day of 5-day) 
      let lastDayObj = data.list.pop();
      let lastDayObjDate = lastDayObj.dt_txt;

      // Sometimes (evening times) openweathermap will give data for 5 days instead of 6.
      // When this happens, days 4 and 5 of the 5-day forecast have the same date and todays date is not included.
      // Since todays date is not included in the fetched data, then tomorrows weather will be shown in the 'today' bootstrap card.
      // However, I can prevent duplicate dates from being added to the forecast array with the following if/else statement.
      ////////// Summary: If only 5 days of weather data are supplied by the API, then 5 days of weather data are shown.
      //////////  If 6 days of weather data are supplide by the API, then 6 days of weather data are shown!
      if (lastDayObjDate !== fiveDayForecast[fiveDayForecast.length - 1]) {
        fiveDayForecast.push(data.list.pop());
        console.log(`Last date of forecast data does not equal last date of forecast array. Added last day (day 6 of forecast array, day 5 of 5 day not including today).`);
      } else {
        console.log(`Last date of forecast array and last date of api data.list match. API not including today's weather in fetched results.`);
      }

      renderForecast(data.city.name, fiveDayForecast);
    })
    .catch(function(err) {
      console.log(err);
    })
}

// openweathermap returns temp data in kelvin so this function is to convert to farenheit.
function kelvinToF(kelvinTemp) {
  return parseInt((kelvinTemp -273.15) * 9 / 5 + 32);
}

const renderForecast = (city, forecast) => {
  console.log(forecast);

  mainContent.html(`
    <h2 class="row justify-content-center mt-3 forecast-day-title">${city}</h2>
    <section class="row justify-content-center five-day-forecast">
    </section>
  `);

  let mainContentForecast = $(`.five-day-forecast`);

  // the date is the current date, then return string 'today'
  function checkCurrentDay(day) {
    let currentDay = dayjs().format(`dddd`);
    let forecastDate = forecast[day].dt_txt
    let forecastDay = dayjs(forecastDate).format('dddd');
    if (forecastDay === currentDay) {
      return `Today`;
    } else {
      return dayjs(forecast[day].dt_txt).format("dddd[, ]MMM D");
    }
  }

  function addDescription(apiWeatherDescription) {
    switch (apiWeatherDescription) {
      case `light rain`:
        return `light rain 	&#x1F326;`
      case `overcast clouds`:
        return `overcast clouds &#x2601;`
      case `clear sky`:
        return `clear sky &#x2600;`;
      case `few clouds`:
        return `few clouds &#x26C5;`
      case `scattered clouds`:
        return `scattered clouds &#x1F324;`;
      case `broken clouds`:
        return `broken clouds &#x26C5;`;
      case `shower rain`:
        return 	`shower rain &#x2614;`;
      case `rain`:
        return `rain 	&#x1F327;`
      case `thunderstorm`:
        return `thunderstorm &#x1F329;`
      case `snow`:
        return `snow &#x2603;`
      case `mist`:
        return `mist`; // cannot find an HTML entity for this one (yet)
    }
  }

  forecast.forEach((day, index) => {
    // This is the HTML injected to create the weather day forecast bootstrap cards.
    // Today's forecast:
    if (index == 0) {
      mainContentForecast.append(`
      <div class="row">
        <div class="card mt-2 mb-4 box-shadow">
          <div class="card-header card-header-today row justify-content-center" style="font-family:'Bebas Neue',sans-serif;font-size: 24px;color: white;">
            ${checkCurrentDay(index)}
          </div>
            <div class="card-body">
              <p class="card-text">Temperature: <span style="font-family: monospace;"><strong>${kelvinToF(day.main.temp)}°F</strong></span></p>
              <p class="card-text">Description: ${addDescription(day.weather[0].description)}</p>
              <p class="card-text">Wind: <span style="font-family: monospace;font-size: 14px;">${day.wind.speed}</span></p>
              <p class="card-text">Humidity: <span style="font-family: monospace;font-size: 14px;">${day.main.humidity}</span></p>
            </div>
        </div>
        </div>
      `)
    } else {
      // 5-day forecast:
      mainContentForecast.append(`
      <div class="col-md-4">
        <div class="card mt-2">
          <div class="card-header row justify-content-center" style="font-family:'Bebas Neue',sans-serif;font-size: 20px;">
            ${checkCurrentDay(index)}
          </div>
            <div class="card-body">
              <p class="card-text">Temperature: <span style="font-family: monospace;"><strong>${kelvinToF(day.main.temp)}°F</strong></span></p>
              <p class="card-text">Description: ${addDescription(day.weather[0].description)}</p>
              <p class="card-text">Wind: <span style="font-family: monospace;font-size: 14px;">${day.wind.speed}</span></p>
              <p class="card-text">Humidity: <span style="font-family: monospace;font-size: 14px;">${day.main.humidity}</span></p>
            </div>
        </div>
        </div>
      `)
    }
  });
}

// after search button is clicked, prevent browser refresh and handle search form submission
searchBtn.on(`click`, (e) => {
  e.preventDefault();
  searchFormSubmit(searchBox.val());
});

