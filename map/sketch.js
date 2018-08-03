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

//const mappa = new Mappa('Leaflet');
const mappa = new Mappa("Google", "AIzaSyAiflBlS2ROLUrwGHvCl3mMRT2GX-kUwJ4");
let myMap;
let initiated = false;
let canvas;

let data;

let options = {
  lat: 52.9271382,
  lng: -1.1862859,
  zoom: 6//,
  //style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
};

ipcRenderer.on("mapMyData", function(e, dataIn) {
  data = dataIn;
  console.log(data);
  if (data.length > 0) {
    let centrePoint = getAverageLocation(data);
    options.lat = centrePoint.lat;
    options.lng = centrePoint.lng;
  }
  canvas = createCanvas(window.innerWidth,window.innerHeight);
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);
  myMap.onChange(mapUpdate);
  initiated = true;
  console.log(myMap);
});

window.onresize = function() {
  console.log(window.innerWidth,window.innerHeight);
  resizeCanvas(window.innerWidth,window.innerHeight);
  // myMap = mappa.tileMap(options);
  // myMap.overlay(canvas);
};

function getAverageLocation(locationData) {
  let countLat = 0;
  let countLon = 0;
  let totalLat = 0;
  let totalLon = 0;

  for (mapPoint of locationData) {
    if (mapPoint.Latitude && mapPoint.Longitude) {
      countLat++;
      countLon++;
      totalLat += parseFloat(mapPoint.Latitude);
      totalLon += parseFloat(mapPoint.Longitude);
    }
  }

  return { lat: totalLat / countLat, lng: totalLon / countLon };
}

function mapUpdate(){
  clear();
    for (let record of data) {
      if (record.Latitude && record.Longitude) {

        let pix = myMap.latLngToPixel(record.Latitude, record.Longitude);
        fill(frameCount % 255, 0, 200, 100);
        let zoom = myMap.zoom();
        ellipse(pix.x, pix.y, (4 + zoom) / 2);

      }
    }
}
function draw(){

}

// function draw() {
//   if (initiated) {
//     clear();
//     for (let record of data) {
//       if (record.Latitude && record.Longitude) {
//         //if (myMap.map.getBounds().contains({ lat: record.Latitude, lng: record.Longitude })) {
//         let pix = myMap.latLngToPixel(record.Latitude, record.Longitude);
//         //console.log(pix);
//         fill(frameCount % 255, 0, 200, 100);
//         let zoom = myMap.zoom();
//         //const scl = pow(2, zoom); // * sin(frameCount * 0.1);
//         ellipse(pix.x, pix.y, (4 + zoom) / 2);
//         //}
//       }
//     }
//   }
// }
