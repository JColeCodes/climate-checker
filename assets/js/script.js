var cityNameEl = document.querySelector("#city-name");
var currentInfoEl = document.querySelector(".data-list");
var displayWeekEl = document.querySelector(".week");
var weatherDiv = document.querySelector(".weather");
var weatherIconDiv = document.querySelector(".weather-icon");
var searchHistoryEl = document.querySelector("#search-history");
var searchInputEl = document.querySelector(".search-city input");
var searchButtonEl = document.querySelector(".search-city button");

// Store latitude and longitude
var currentData = {
    lat: null,
    lon: null
};
var recentCities = [];

var selectedCity = "";

// Loading icon
var loader = document.createElement("div");
loader.classList.add("loading");
// Error message div
var errorMessage = document.createElement("div");
errorMessage.classList.add("error");
var errorFound = false;

// City find error
var findError = function(status) {
    // Remove load icon when data is ready
    if (weatherDiv.hasChildNodes(loader)){
        weatherDiv.removeChild(loader);
    }
    // Clear any previous content
    currentInfoEl.innerHTML = "";
    displayWeekEl.innerHTML = "";
    selectedCity = "";
    document.querySelector("input[name='city']").value = "";

    // Set error message
    if (status < 500 && status > 200) {
        errorMessage.textContent = "Your search is not a valid city."
    } else if (status != 200) {
        errorMessage.textContent = "There is currently an error with a server. Please try your search later."
    }
    weatherDiv.appendChild(errorMessage);
    errorFound = true;
}

// Remove cities from recent cities list
var removeRecent = function(cityName) {
    var cityIndex = recentCities.indexOf(cityName);
    recentCities.splice(cityIndex, 1);
    showRecent();
}

// Show recent cities list
var showRecent = function() {
    // Clear to prevent duplicates
    searchHistoryEl.innerHTML = "";
    // Add each city
    for (var i = 0; i < recentCities.length; i++) {
        // Create li and button
        var searchHistoryLi = document.createElement("li");
        var searchHistoryButton = document.createElement("button");
        searchHistoryButton.classList.add("recent-button");

        // Button text shows full city + state + country
        searchHistoryButton.textContent = recentCities[i];
        // Get city name to search again
        var cityName = recentCities[i].split(", ");
        if (cityName[cityName.length - 1] == "US") {
            // If US city, search by city + state
            var searchCity = cityName[0] + ", " + cityName[1];
        } else {
            // If else, search by city + country
            var searchCity = cityName[0] + ", " + cityName[cityName.length - 1];
        }
        // Button onClick function
        searchHistoryButton.setAttribute("onClick", "smartSearch('" + searchCity + "')");
        selectedCity = searchCity;

        // Create delete button for if user wants to remove the city from recent searches
        var searchButtonDelete = document.createElement("button");
        searchButtonDelete.classList.add("delete-button");
        searchButtonDelete.innerHTML = "<i class='fas fa-times'></i>";
        searchButtonDelete.setAttribute("onClick", "removeRecent('" + recentCities[i] + "')");

        // Append to page
        searchHistoryLi.appendChild(searchHistoryButton);
        searchHistoryLi.appendChild(searchButtonDelete);
        searchHistoryEl.appendChild(searchHistoryLi);
    }
    // If you have more than 10 recent searches, let's limit how many are saved to the most recent 10
    if (recentCities.length > 10) {
        recentCities.pop();
        showRecent();
    }
}

// Get from localStorage
if ("weather-cities" in localStorage) {
    recentCities = JSON.parse(localStorage.getItem("weather-cities"));
    showRecent();
}
// Save in localStorage
var saveCities = function() {
    localStorage.setItem("weather-cities", JSON.stringify(recentCities));
}

// Get weather
var getWeather = function(cityName, flag) {
    var weatherURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + currentData.lat + "&lon=" + currentData.lon + "&units=imperial&APPID=75a79d6afb356a02efc4ce91a90d5865"; // Search by lat and lon with imperial measurements

    // Run fetch
    fetch(weatherURL)
    .then(function(response){
        if (response.ok) {
            response.json().then(function(data) {
                // Remove load icon when data is ready
                if (weatherDiv.hasChildNodes(loader)){
                    weatherDiv.removeChild(loader);
                }

                if (weatherDiv.classList.contains("hidden")) {
                    weatherDiv.classList.remove("hidden");
                }
                // Clear any previous content
                currentInfoEl.innerHTML = "";
                displayWeekEl.innerHTML = "";
                weatherIconDiv.innerHTML = "";
                cityNameEl.innerHTML = "";
                // Display city name
                var displayCity = document.createElement("span");
                displayCity.classList.add("city-name");
                displayCity.textContent = cityName;
                cityNameEl.appendChild(displayCity);
                // Get UV Index color
                var uvi = data.current.uvi;
                var uviColor = "green";
                if (uvi >= 3 && uvi < 6) {
                    uviColor = "yellow";
                } else if (uvi >= 6 && uvi < 8) {
                    uviColor = "orange";
                } else if (uvi >= 8 && uvi < 11) {
                    uviColor = "red";
                } else if (uvi >= 11) {
                    uviColor = "violet";
                }
                // Get which data should be displayed
                var displayData = [
                    {
                        label: "Temp: ",
                        info: data.current.temp,
                        unit: "°F"
                    }, {
                        label: "Wind: ",
                        info: data.current.wind_speed,
                        unit: " MPH"
                    }, {
                        label: "Humidity: ",
                        info: data.current.humidity,
                        unit: "%"
                    }, {
                        label: "UV Index: <div class='uv uv-" + uviColor + "'>",
                        info: uvi,
                        unit: "</div>"
                    }];
                // For each one, add list item and append to page
                for (var i = 0; i < displayData.length; i++) {
                    var datalistItem = document.createElement("li");
                    datalistItem.innerHTML =
                        displayData[i].label + 
                        displayData[i].info + 
                        displayData[i].unit;
                    currentInfoEl.appendChild(datalistItem);
                }
                // Current weather icon
                var weatherIcon = document.createElement("img");
                weatherIcon.setAttribute("src", "./assets/images/icons/" + data.current.weather[0].icon + ".png");
                weatherIconDiv.appendChild(weatherIcon);

                // Get date and time based off timezone
                var time = moment().tz(data.timezone).format("MM/DD/YYYY h:mm A");
                var displayDate = document.createElement("span");
                displayDate.classList.add("date-time");
                displayDate.textContent = time;
                cityNameEl.appendChild(displayDate);

                // Get country flag
                var flagImg = document.createElement("img");
                flagImg.setAttribute("src", flag);
                cityNameEl.appendChild(flagImg);
                
                // Display 5 day forecast starting tomorrow
                for (var i = 1; i < 6; i++) {
                    // Get date from daily weather
                    var weeklyDate = moment.unix(data.daily[i].dt).format("MM/DD/YYYY");
                    // Create div element with class "day"
                    var dayDiv = document.createElement("div");
                    dayDiv.classList.add("day");
                    // Weather data
                    var dayData = "<h4>" + weeklyDate + "</h4>\
                        <div class='daily-icon'><img src='./assets/images/icons/" + data.daily[i].weather[0].icon + ".png'></div>\
                        <div class='daily-info'><p>Temp: " + data.daily[i].temp.day + "°F</p>\
                        <p>Wind: "  +data.daily[i].wind_speed + " MPH</p>\
                        <p>Humidity: " + data.daily[i].humidity + "%</p></div>";
                    dayDiv.innerHTML = dayData;
                    displayWeekEl.appendChild(dayDiv);
                }

                // Clear input
                document.querySelector("input[name='city']").value = "";
                
                // Display and save recent search
                showRecent();
                saveCities();
            });
            } else {
                findError(404);
            }
        })
        .catch(function(){
            findError(501);
        });
}

// Get latitude and longitude of city
var getCoordinates = function(city, identifier, idCode) { // Inputs city and code names
    var cityName = city;
    
    var cityURL = "http://api.openweathermap.org/geo/1.0/direct?q=" + cityName + "&limit=3&APPID=75a79d6afb356a02efc4ce91a90d5865"; // Limited to 3 cities of the same name... Sorry to all the Springfields out there.

    // Run fetch
    fetch(cityURL)
        .then(function(response) {
            if (response.ok) {
                return response.json();
            }
            else {
                findError(response.status);
            }
        })
        .then(function(data) {
            // Clear current data for new content
            currentData.lat = null;
            currentData.lon = null;
            // Reverse order, so API's first result comes out if loop isn't broken
            data.reverse();
            for (var i = 0; i < data.length; i++) {
                currentData.lat = data[i].lat; // Save the latitude
                currentData.lon = data[i].lon; // Save the longitude

                // Create city name var for display
                var cityName = data[i].name + ", ";
                // If city searched is a US state, add the state in there
                if (data[i].state) {
                    cityName += data[i].state + ", ";
                }
                // Add country to the var
                cityName += data[i].country;
                // Get flag image
                var countryID = data[i].country.toLowerCase();
                var flag = "https://flagcdn.com/" + countryID + ".svg";
                
                // If a country code or state name was submitted
                if (identifier) {
                    // If the identifier submitted matches the api data's country OR state, break the loop, that's the one we want
                    if (identifier == data[i].country || identifier == data[i].state){
                        break;
                    }
                    // If state and country have matching codes and the city is not in the state, then check for city in country of same code
                    if (idCode) {
                        if (idCode == data[i].country || idCode == data[i].state){
                            break;
                        }
                    }
                }
            }

            // Time to get the weather
            if (!currentData.lat) {
                findError(404);
            } else {
                // If recent cities array contains current city, remove so it's not in the list twice
                if (recentCities.includes(cityName)) {
                    removeRecent(cityName);
                }
                // Add this city to beginning of recent cities array
                recentCities.unshift(cityName);
                getWeather(cityName, flag);
            }
        })
        .catch(function(){
            findError(501);
        });
}

// So, apparently South Africa's country code is ZA, even though there's no Z in the English name for the country. Knowing all the country codes is hard, so you can just type in the country's name.
var getCountry = function(city, input) {
    var stateAPI = "https://countriesnow.space/api/v0.1/countries/iso"; // Thanks countries now!

    // Run fetch
    fetch(stateAPI)
        .then(function(response) {
            if (response.ok) {
                return response.json();
            }
            else {
                findError(response.status);
            }
        })
        .then(function(data) {
            var countryCode = ""; // Country code variable
            var isCountry = false; // Is this a country? boolean
            for (var i = 0; i < data.data.length; i++) {
                // Uppercase to work better
                var countryUpper = data.data[i].name.toUpperCase();
                var inputUpper = input.toUpperCase();
                var countryIso = data.data[i].Iso2;
                var countryIso3 = data.data[i].Iso3;
                // Includes because some full names can be long, let's just search the common name
                // Have to manually add Russia because this API is missing it????
                if ((inputUpper == countryIso) || (inputUpper == countryIso3) || (inputUpper == "RU") || ("RUSSIA".includes(inputUpper)) || (countryUpper.includes(inputUpper) && inputUpper.length > 2)) {
                    countryCode = countryIso; // Set country code
                    isCountry = true; // Set boolean to true
                    break; // Break from loop
                }
            }
            // If it's still false, something is wrong...
            if (!isCountry) {
                findError(404);
            } else {
                // It IS a country! Let's run coordinates
                getCoordinates(city, countryCode);
            }
        })
        .catch(function(){
            findError(501);
        });
}
// If the user wants to type in the state name OR part of the state name OR the state initials/code
var getState = function(city, input) {
    var stateAPI = "https://gist.githubusercontent.com/mshafrir/2646763/raw/8b0dbb93521f5d6889502305335104218454c2bf/states_hash.json"; // Thanks user on GitHub!

    // Run fetch
    fetch(stateAPI)
        .then(function(response) {
            if (response.ok) {
                return response.json();
            }
            else {
                findError(response.status);
            }
        })
        .then(function(data) {
            var stateName = ""; // State code variable
            var stateCode = ""; // State code variable
            var isState = false; // Is this a state? boolean
            // Let's convert all the letters to the same case, so we're working with the same thing
            var inputUpper = input.trim().toUpperCase();
            for (const state in data) {
                // Convert the api data to also be uppercase, so we can search!
                var stateUpper = data[state].toUpperCase();
                // Using includes in case you're too lazy to write out California or Massachusetts and just put "Cali" or "Mass"... Still works! Also works if you don't get the territories' full names, cool!
                if ((inputUpper == state) || (stateUpper.includes(inputUpper) && inputUpper.length > 2)) {
                    stateName = data[state]; // Set state name
                    stateCode = state;
                    isState = true; // Set boolean to true
                    break; // break out of loop
                }
            }
            // If the state code is still false by now, looks like it's not a state, let's run through the countries next
            if (!isState) {
                getCountry(city, input);
            } else {
                // It is a state? Nice, let's get the coordinates.
                getCoordinates(city, stateName, stateCode);
            }
        })
        .catch(function(){
            findError(501);
        });
}

// Smart Search, for more advanced search options
// I did this because I wanted to see if searching "Salem" would return the one in OR or MA. Not to mention London, England vs. London, Canada! Let's expand our horizons a little bit!
var smartSearch = function(input) {
    selectedCity = input;
    // If there is a comma run smart search to see what state or country user wants
    if (selectedCity.includes(",")) {
        // Split city and state/country into separate strings
        var cityArr = input.split(",");
        // Trim any whitespace from both strings
        for (var i = 0; i < cityArr.length; i++) {
            cityArr[i] = cityArr[i].trim();
        }
        // Convert to uppercase, so we're working with the same characters
        cityArr[1] = cityArr[1].toUpperCase();
        // If user puts "UK"/United Kingdom, change to "GB"/Great Britain because the API uses that
        if (cityArr[1] == "UK") {
            cityArr[1] = "GB";
        }
        // If user puts "UAE"/United Arab Emirates, change to "AE" because the API uses that
        if (cityArr[1] == "UAE") {
            cityArr[1] = "AE";
        }
        getState(cityArr[0], cityArr[1]);
    } else {
        // If only a city name is input ("I.E. London") without a , to denote specifics, get coordinates
        getCoordinates(input);
    }

    // Hides former search
    if (!weatherDiv.classList.contains("hidden")) {
        weatherDiv.classList.add("hidden");
    }

    // Append load icon
    weatherDiv.appendChild(loader);

    // If an error was previously found, remove message
    if (errorFound) {
        weatherDiv.removeChild(errorMessage);
        errorFound = false;
    }
}

// Search button
searchButtonEl.addEventListener("click", function(event) {
    // Prevent default refresh
    event.preventDefault();
    // Get value
    selectedCity = document.querySelector("input[name='city']").value;
    // Run smart search
    smartSearch(selectedCity);
});