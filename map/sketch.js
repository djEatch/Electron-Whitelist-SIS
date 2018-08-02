// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain

// Subscriber Mapping Visualization
// https://youtu.be/Ae73YY_GAU8

require("p5");

const electron = require("electron");
const { ipcRenderer } = electron;
const bootstrap = require("bootstrap"); //required even though not called!!
var $ = require("jquery");

let youtubeData;
let countries;

const mappa = new Mappa('Leaflet');
let myMap;
let initiated = false;
let canvas;

let data;

const options = {
  lat: 0,
  lng: 0,
  zoom: 5,
  style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
}

ipcRenderer.on("mapMyData", function(e, dataIn) {
  data = dataIn;
  console.log(data);
  canvas = createCanvas(800, 600);
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);
  initiated = true;
});


function draw() {
  if(initiated){
  clear();
  for (let record of data) {
    const pix = myMap.latLngToPixel(record.Latitude, record.Longitude);
    fill(frameCount % 255, 0, 200, 100);
    const zoom = myMap.zoom();
    const scl = pow(2, zoom); // * sin(frameCount * 0.1);
    ellipse(pix.x, pix.y, 4 * scl);
  }
  }
}


// function preload() {
//   youtubeData = loadTable('subscribers_geo.csv', 'header');
//   //youtubeData = loadTable('watch_time_geo.csv', 'header');
//   countries = loadJSON('countries.json');

// }

// function setup() {
//   canvas = createCanvas(800, 600);
//   trainMap = mappa.tileMap(options);
//   trainMap.overlay(canvas);

//   let maxSubs = 0;
//   let minSubs = Infinity;

//   for (let row of youtubeData.rows) {
//     let country = row.get('country_id').toLowerCase();
//     let latlon = countries[country];
//     if (latlon) {
//       let lat = latlon[0];
//       let lon = latlon[1];
//       // let count = Number(row.get('views'));
//       // let count = Number(row.get('watch_time_minutes'));
//       let count = Number(row.get('subscribers'));
//       data.push({
//         lat,
//         lon,
//         count
//       });
//       if (count > maxSubs) {
//         maxSubs = count;
//       }
//       if (count < minSubs) {
//         minSubs = count;
//       }
//     }
//   }

//   let minD = sqrt(minSubs);
//   let maxD = sqrt(maxSubs);

//   for (let country of data) {
//     country.diameter = map(sqrt(country.count), minD, maxD, 1, 20);
//   }

//   //console.log(data);



//   // console.log(countries);
//   //console.log(youtubeData);
// }

// function draw() {
//   clear();
//   for (let country of data) {
//     const pix = trainMap.latLngToPixel(country.lat, country.lon);
//     fill(frameCount % 255, 0, 200, 100);
//     const zoom = trainMap.zoom();
//     const scl = pow(2, zoom); // * sin(frameCount * 0.1);
//     ellipse(pix.x, pix.y, country.diameter * scl);
//   }



// }