var cityNameEl = document.querySelector("#city-name");
var currentInfoEl = document.querySelector(".data-list");
var displayWeekEl = document.querySelector(".week");
var searchInputEl = document.querySelector(".search-city input");
var searchButtonEl = document.querySelector(".search-city button");

// Store latitude and longitude
var currentData = {
    lat: null,
    lon: null
};

// Get weather
var getWeather = function(cityName) {
    var weatherURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + currentData.lat + "&lon=" + currentData.lon + "&units=imperial&APPID=75a79d6afb356a02efc4ce91a90d5865"; // Search by lat and lon with imperial measurements

    // Run fetch
    fetch(weatherURL)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log(data);
            // Clear any previous content
            currentInfoEl.innerHTML = "";
            // Display city name
            cityNameEl.textContent = cityName;
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
                    label: "UV Index: ",
                    info: data.current.uvi,
                    unit: ""
                }];
            // For each one, add list item and append to page
            for (var i = 0; i < displayData.length; i++) {
                var datalistItem = document.createElement("li");
                datalistItem.textContent =
                    displayData[i].label + 
                    displayData[i].info + 
                    displayData[i].unit;
                currentInfoEl.appendChild(datalistItem);
            }
            // Get date and time based off timezone
            var time = moment().tz(data.timezone).format("MM/DD/YYYY h:mm A");
            var displayDate = document.createElement("span");
            displayDate.textContent = time;
            cityNameEl.appendChild(displayDate);
            
            // Display 5 day forecast starting tomorrow
            for (var i = 1; i < 6; i++) {
                // Get date from daily weather
                var weeklyDate = moment.unix(data.daily[i].dt).format("MM/DD/YYYY");
                // Create div element with class "day"
                var dayDiv = document.createElement("div");
                dayDiv.classList.add("day");
                // Weather data
                var dayData = "<h4>" + weeklyDate + "</h4>\
                    <p>Temp: " + data.daily[i].temp.day + "°F</p>\
                    <p>Wind: "  +data.daily[i].wind_speed + " MPH</p>\
                    <p>Humidity: " + data.daily[i].humidity + "%</p>";
                dayDiv.innerHTML = dayData;
                displayWeekEl.appendChild(dayDiv);
            }
            
        });
}

// Get latitude and longitude of city
var getCoordinates = function(city, code) { // Inputs city and code names
    var cityName = city;
    
    var cityURL = "http://api.openweathermap.org/geo/1.0/direct?q=" + cityName + "&limit=3&APPID=75a79d6afb356a02efc4ce91a90d5865"; // Limited to 3 cities of the same name... Sorry to all the Springfields out there.

    // Run fetch
    fetch(cityURL)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            // Reverse order, so API's first result comes out if loop isn't broken
            data.reverse();
            for (var i = 0; i < data.length; i++) {
                currentData.lat = data[i].lat; // Save the latitude
                currentData.lon = data[i].lon; // Save the longitude

                // Create city name var for display
                var cityName = data[i].name + ", ";
                // If city searched is a US state, add the state in there
                if (data[i].country === "US") {
                    cityName += data[i].state + ", ";
                }
                // Add country to the var
                cityName += data[i].country;

                // If a country code was submitted
                if (code) {
                    // If the code submitted matches the api data's country OR state, break the loop, that's the one we want
                    if (code == data[i].country || code == data[i].state){
                        break;
                    }
                }
            }
            console.log(currentData);

            // Time to get the weather
            getWeather(cityName);
        });
}

// So, apparently South Africa's country code is ZA, even though there's no Z in the English name for the country. Knowing all the country codes is hard, so you can just type in the country's name.
var getCountry = function(city, input) {
    var stateAPI = "https://countriesnow.space/api/v0.1/countries/iso"; // Thanks countries now!

    // Run fetch
    fetch(stateAPI)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            var countryCode = ""; // Country code variable
            var isCountry = false; // Is this a country? boolean
            for (var i = 0; i < data.data.length; i++) {
                // Lowercase to work better
                var countryLower = data.data[i].name.toLowerCase();
                var inputLower = input.toLowerCase();
                // Includes because some full names can be long, let's just search the common name
                if (countryLower.includes(inputLower)) {
                    countryCode = data.data[i].Iso2; // Set country code
                    isCountry = true; // Set boolean to true
                    break; // Break from loop
                }
            }
            // If it's still false, something is wrong...
            if (!isCountry) {
                console.log("Hey, there, bud"); // Coming soon
            } else {
                // It IS a country! Let's run coordinates
                getCoordinates(city, countryCode);
            }
        });
}
// There's so many M-states, like which one is which? Maine is ME? Well, if you type the state in, let's find the country code (inclues territories, so handy)!
var getState = function(city, input) {
    var stateAPI = "https://gist.githubusercontent.com/mshafrir/2646763/raw/8b0dbb93521f5d6889502305335104218454c2bf/states_hash.json"; // Thanks user on GitHub!

    // Run fetch
    fetch(stateAPI)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            var stateCode = ""; // State code variable
            var isState = false; // Is this a state? boolean
            // Let's convert all the letters to the same case, so we're working with the same thing
            var inputLower = input.trim().toLowerCase();
            for (const state in data) {
                // Convert the api data to also be lowercase, so we can search!
                var stateLower = data[state].toLowerCase();
                // Using includes in case you're too lazy to write out California or Massachusetts and just put "Cali" or "Mass"... Still works! Also works if you don't get the territories' full names, cool!
                if (stateLower.includes(inputLower)) {
                    stateCode = state; // Set state code
                    isState = true; // Set boolean to true
                    break; // break out of loop
                }
            }
            // If the state code is still false by now, looks like it's not a state, let's run through the countries next
            if (!isState) {
                getCountry(city, inputLower);
            } else {
                // It is a state? Nice, let's get the coordinates.
                getCoordinates(city, stateCode);
            }
        });
}

// Smart Search, for more advanced search options
// I did this because I wanted to see if searching "Salem" would return the one in OR or MA, and got the one in IN... Not to mention London, England vs. London, Canada! Let's expand our horizons a little bit!
var smartSearch = function(input) {
    // If there is a comma run smart search to see what state or country user wants
    if (input.includes(",")) {
        // Split city and state/country into separate strings
        var cityArr = input.split(",");
        // Trim any whitespace from both strings
        for (var i = 0; i < cityArr.length; i++) {
            cityArr[i] = cityArr[i].trim();
        }
        // Convert to uppercase, so we're working with the same characters
        cityArr[1]= cityArr[1].toUpperCase();
        // If user puts "UK"/United Kingdom, change to "GB"/Great Britain because the API uses that
        if (cityArr[1] == "UK") {
            cityArr[1] = "GB";
        }
        // If the input is 2 letters in length, it's a country/state code, and we can get coordinates
        if (cityArr[1].length <= 2){
            getCoordinates(cityArr[0], cityArr[1]);
        } else {
            // If the input is longer, we need to find the state/country codes, run to check states first
            getState(cityArr[0], cityArr[1]);
        }
    } else {
        // If only a city name is input ("I.E. London") without a , to denote specifics, get coordinates
        getCoordinates(input);
    }
    
}

// Search button
searchButtonEl.addEventListener("click", function(event) {
    // Prevent default refresh
    event.preventDefault();
    // Get value
    var selectedCity = document.querySelector("input[name='city']").value;
    // Run smart search
    smartSearch(selectedCity);
});