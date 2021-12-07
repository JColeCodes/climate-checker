var cityNameEl = document.querySelector("#city-name");
var searchInputEl = document.querySelector(".search-city input");
var searchButtonEl = document.querySelector(".search-city button");

// Store latitude and longitude
var currentData = {
    lat: null,
    lon: null
};

// Get weather
var getWeather = function() {
    var weatherURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + currentData.lat + "&lon=" + currentData.lon + "&APPID=75a79d6afb356a02efc4ce91a90d5865";

    fetch(weatherURL)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log(data);
        });
}

// Get latitude and longitude of city
var getCoordinates = function(city, code) {
    var cityName = city;
    
    var cityURL = "http://api.openweathermap.org/geo/1.0/direct?q=" + cityName + "&limit=3&APPID=75a79d6afb356a02efc4ce91a90d5865";

    fetch(cityURL)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log(data);
            data.reverse();
            for (var i = 0; i < data.length; i++) {
                currentData.lat = data[i].lat;
                currentData.lon = data[i].lon;

                var cityName = data[i].name + ", ";
                if (data[i].country === "US") {
                    cityName += data[i].state + ", ";
                }
                cityName += data[i].country;
                cityNameEl.textContent = cityName;

                if (code) {
                console.log(code);
                    if (code == data[i].country || code == data[i].state){
                        break;
                    }
                }
            }
            console.log(currentData);

            getWeather();
        });
}

// Test space
var getCountry = function(city, input) {
    var stateAPI = "https://countriesnow.space/api/v0.1/countries/iso";

    fetch(stateAPI)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            var countryCode = "";
            var isCountry = false;
            for (var i = 0; i < data.data.length; i++) {
                var countryLower = data.data[i].name.toLowerCase();
                var inputLower = input.toLowerCase();
                if (countryLower.includes(inputLower)) {
                    isCountry = true;
                    countryCode = data.data[i].Iso2;
                    break;
                }
            }
            if (!isCountry) {
                console.log("Hey, there, bud");
            } else {
                getCoordinates(city, countryCode);
            }
        });
}
var getState = function(city, input) {
    var stateAPI = "https://gist.githubusercontent.com/mshafrir/2646763/raw/8b0dbb93521f5d6889502305335104218454c2bf/states_hash.json";
    var stateCode = "";
    var isState = false;

    fetch(stateAPI)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log(input);
            var inputLower = input.trim().toLowerCase();
            for (const state in data) {
                var stateLower = data[state].toLowerCase();
                if (stateLower.includes(inputLower)) {
                    stateCode = state;
                    isState = true;
                    break;
                }
            }
            console.log(stateCode);
            if (!isState) {
                getCountry(city, inputLower);
            } else {
                getCoordinates(city, stateCode);
            }
        });
}

var smartSearch = function(input) {
    console.log(input.includes(","));
    if (input.includes(",")) {
        var cityArr = input.split(",");
        for (var i = 0; i < cityArr.length; i++) {
            cityArr[i] = cityArr[i].trim();
        }
        cityArr[1]= cityArr[1].toUpperCase();
        if (cityArr[1] == "UK") {
            cityArr[1] = "GB";
        }
        if (cityArr[1].length <= 2){
            getCoordinates(cityArr[0], cityArr[1]);
        } else {
            getState(cityArr[0], cityArr[1]);
        }
    } else {
        getCoordinates(input);
    }
}

searchButtonEl.addEventListener("click", function(event) {
    event.preventDefault();
    var selectedCity = document.querySelector("input[name='city']").value;
    console.log(selectedCity);
    smartSearch(selectedCity);
});