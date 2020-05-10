const simulations = {
  cases: 0,
  deaths: 1,
};

let table;
let img;
let count = 5;
let simulation = simulations.cases;
timedelay = 0;
let canvasWidth = 0;
let canvasHeight = 0;
let TopCountry;

let mapUrl = "https://github.com/mpsteenstrup/Covid19DatabaseTutorial/blob/master/images/map.jpg?raw=true";
let mapNaturalWidth;
let mapNaturalHeight;

function preload() {
  casesTable = loadTable(
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
    "csv",
    "header"
  );
  deathsTable = loadTable(
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv",
    "csv",
    "header"
  );

  metaImage = new Image();
  metaImage.addEventListener("load", function () {
    //henter billedets størrelse, så biledet ikke bliver strukket unaturligt, når det tilpasses skærmen
    mapNaturalWidth = this.naturalWidth;
    mapNaturalHeight = this.naturalHeight;
    setCanvasSize();
    loop();
  });
  metaImage.src = mapUrl;

  img = createImg(mapUrl);
  img.hide();
}

function setup() {
  canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("map1");

  textSize(60);
  fill(200);
  frameRate(5);
  noStroke();
}

function windowResized() {
  setCanvasSize();
  count = 5;
}

let paused = false;
function draw() {
  if (mapNaturalWidth == undefined) 
  {
    //billedet er ikke loadet endnu, så vi må lige vente, for vi har brug for dens størrelse
    noLoop();
    return;
  }

  frameRate(30 / log(count));
  image(img, 0, 0, canvasWidth, canvasHeight);

  totalCases = 0;
  totalDeaths = 0;

  lat = casesTable.getColumn("Lat");
  long = casesTable.getColumn("Long");
  confirmed = casesTable.getColumn(count);
  deaths = deathsTable.getColumn(count);

  /*
  her er det loop der laver søjlerne.
  hvis du kører programmet kan du se at søjlerne skifter mellem grøn og rød, men det ser ret tilfældigt ud (USA er grøn i hele den periode, hvor den stiger, hvilket ikke virker realistsik)
  optimalt vil en rød søjle vise at der kommer flere og flere smittede/døde per dag, og en grøn vil vise det modsatte.
  */

  if (simulation == simulations.cases) 
  {
    for (i = 0; i < casesTable.getRowCount(); i++) 
    {
      drawCircle(confirmed, casesTable, 2000);
      totalCases = totalCases + parseInt(confirmed[i]);

      if (!TopCountry) 
      {
        TopCountry = casesTable.getRow([i]).arr[1];
      } 
      else if (parseInt(confirmed[i]) > parseInt(casesTable.findRow(TopCountry, 1).arr[count])) 
      {
        TopCountry = casesTable.getRow([i]).arr[1];
      }
    }
  } 
  else 
  {
    for (i = 0; i < deathsTable.getRowCount(); i++) 
    {
      drawCircle(deaths, deathsTable, 200);
      totalDeaths = totalDeaths + parseInt(deaths[i]);

      if (!TopCountry) 
      {
        TopCountry = deathsTable.getRow([i]).arr[1];
      } 
      else if (parseInt(deaths[i]) > parseInt(deathsTable.findRow(TopCountry, 1).arr[count])) 
      {
        TopCountry = deathsTable.getRow([i]).arr[1];
      }
    }
  }

  /*
  herunder er koden for tekstfelterne
  */
  if (simulation == simulations.cases) 
  {
    document.getElementById("total1").innerHTML ="Confirmed cases: " + totalCases;
    totalCases=0;
  } 
  else 
  {
    document.getElementById("total1").innerHTML = "Deaths: " + totalDeaths;
    totalDeaths=0;
  }
  document.getElementById("topCountry1").innerHTML = "Top country: " + TopCountry;
  document.getElementById("date1").innerHTML = "Date: " + casesTable.columns[count];

  count += 1;
  if (count > casesTable.getColumnCount() - 1)
  {
    count = casesTable.getColumnCount() - 1;
  }
}

function getX(longitude) {
  return (longitude * canvasWidth) / 360 + canvasWidth / 2;
}

//når y skal findes ganges der med 0.75 fordi kortets ækvator ikke sidder midt i billedet
function getY(latitude) {
  return canvasHeight * 0.75 + (-1 * (latitude * canvasHeight)) / 180;
}

//når der klikkes på skærmen, starter udviklingen forfra
function mousePressed() {
  count = 5;
}

function drawCircle(column, table, factor){
  circle(
    getX(long[i]),
    getY(lat[i]),
    ((-1 * column[i]) / factor) * getMapResizeRatio() //radius
  );

  if (isWorsening(column, table)) 
  {
    fill(255, 0, 0, 80);
  }
  else 
  {
    fill(0, 255, 0, 80);
  }
}

function isWorsening(column, table) {
    if(count > 12) {
      return   ( 
           (table.getColumn(count)[i] - table.getColumn(count - 3)[i]) / 3    
            >
           (table.getColumn(count-3)[i] - table.getColumn(count - 6)[i]) / 3
      );
    }
    else
    {
      return false;
    }
}

//Kaldes når der klikkes på knappen for "nye sager"
function displayCases() {
  simulation = simulations.cases;
  resizeCanvas(canvasWidth, canvasHeight);
  count = 5;
}

//Kaldes når der klikkes på knappen for "døde"
function displayDeaths() {
  simulation = simulations.deaths;
  resizeCanvas(canvasWidth, canvasHeight);
  count = 5;
}

//canvasen tilpasses det element den vises i. Bredden tilpasses højden på kortet.
function setCanvasSize() {
  var parentDivsRealSize = document
    .getElementById("map1")
    .getBoundingClientRect();
  canvasWidth = parentDivsRealSize.width;

  if (mapNaturalWidth == undefined) {
    //første gang canvasen tegnes, er kortet endnu ikke loadet, så vi kender ikke dens størrelse
    canvasHeight = parentDivsRealSize.height;
  } else {
    //højden på kortet tilpasses efter hvor meget kortet er blevet formindsket på x-aksen
    canvasHeight = mapNaturalHeight * (canvasWidth / mapNaturalWidth);
  }

  resizeCanvas(canvasWidth, canvasHeight);
}

//når kortet er mindre, skal grafikken også være mindre, derfor ganges radius med forholde timellem det oprindelige kort og den aktuelle størrelse det har på siden
function getMapResizeRatio() {
  return canvasHeight / mapNaturalHeight;
}
