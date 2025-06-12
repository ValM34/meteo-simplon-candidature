async function init() {
  handleMeteoCardState("loading");

  // FETCH DATA
  async function fetchTownConfiguration() {
    const townConfiguration = await fetch(`./conf.json`)
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        console.error("Erreur interne :", error);
      });

    return townConfiguration;
  }
  let townConfiguration = await fetchTownConfiguration();
  if(!townConfiguration) {
    handleMeteoCardState("error");
  }

  async function fetchTownDataList() {
    const townDataList = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${townConfiguration.ville}&count=13&language=fr&format=json`)
      .then((response) => response.json())
      .then((data) => data.results)
      .catch((error) => {
        console.error("Erreur lors de la récupération des données de la ville :", error);
      });
    return townDataList;
  }
  let townDataList = await fetchTownDataList();
  if(!townDataList) {
    handleMeteoCardState("error");
  }

  // Filter town data list by postal code
  const townData = townDataList.find(townData => {
    const townPostCodesList = townData.postcodes;
    if (!townPostCodesList) {
      return false;
    }
    const townPostCode = townPostCodesList.find(townPostCode => townPostCode === townConfiguration.code_postal);
    return townPostCode === townConfiguration.code_postal
  })

  async function fetchWeatherData() {
    const weatherData = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${townData.latitude}&longitude=${townData.longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,&models=meteofrance_seamless`)
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        console.error("Erreur lors de la récupération des données météo :", error);
      });

    return weatherData;
  }
  let weatherData = await fetchWeatherData();
  if(!weatherData || weatherData?.error === true) {
    handleMeteoCardState("error");
  } else {
    handleMeteoCardState("success");
  }

  // DOM UPDATES
  const date = new Date();
  const hour = date.getHours();
  const minutes = date.getMinutes();

  document.querySelector('#town_name').textContent = townConfiguration.ville;
  document.querySelector('#town_date').textContent = date.toLocaleDateString();
  document.querySelector('#town_hour').textContent = hour;
  document.querySelector('#town_temperature').textContent = weatherData.hourly.temperature_2m[hour] + "°C";
  document.querySelector('#town_humidity').textContent = weatherData.hourly.relative_humidity_2m[hour];
  document.querySelector('#town_wind_speed').textContent = weatherData.hourly.wind_speed_10m[hour];

  if(weatherData.hourly.temperature_2m[hour] > 20) {
    document.querySelector('#town_temperature').style.color = "#f13e40";
    document.querySelector('#town_temperature').style.background = "rgba(255, 0, 0, 0.1)";
  } else {
    document.querySelector('#town_temperature').style.color = "#008eff";
    document.querySelector('#town_temperature').style.background = "rgba(0, 149, 255, 0.1)";
  }

  function handleMeteoCardState(state) {
    if(state === "loading") {
      document.querySelector('#meteo_card_loader').style.display = "flex";
      document.querySelector('#meteo_card').style.display = "none";
      document.querySelector('#error_message').style.display = "none";
    } else if(state === "success") {
      document.querySelector('#meteo_card_loader').style.display = "none";
      document.querySelector('#meteo_card').style.display = "flex";
      setTimeout(() => {
        document.querySelector('#meteo_card').style.opacity = "1";
      }, 100);
      document.querySelector('#error_message').style.display = "none";
    } else if(state === "error") {
      document.querySelector('#meteo_card_loader').style.display = "none";
      document.querySelector('#meteo_card').style.display = "none";
      document.querySelector('#error_message').style.display = "block";
    }
  }
}

function getTimeUntilNextHour() {
  const date = new Date();
  const nextHourDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1, 0, 0);
  return nextHourDate - date;
}

async function updateDataEachHour() {
    await init();
    await new Promise(resolve => setTimeout(resolve, getTimeUntilNextHour()));
}

updateDataEachHour();
