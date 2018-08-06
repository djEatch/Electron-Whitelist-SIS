//require("p5");
const L = require("leaflet");

const electron = require("electron");
const { ipcRenderer } = electron;
const bootstrap = require("bootstrap"); //required even though not called!!
var $ = require("jquery");

let columbusCol = "Columbus";
let resilientCol = "Resilient";

let resilientStores = [];
let resilientGroup;

//const mappa = new Mappa('Leaflet');

let myMap;
let initiated = false;
//let canvas;

let data;

let options = {
  lat: 52.9271382,
  lng: -1.1862859,
  zoom: 6,
  style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
};

let myCustomColour = ['#583470']

const markerHtmlStyles = `
  background-color: ${myCustomColour};
  width: 3rem;
  height: 3rem;
  display: block;
  left: -1.5rem;
  top: -1.5rem;
  position: relative;
  border-radius: 3rem 3rem 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF`

const myicon = L.divIcon({
  className: "my-custom-pin",
  iconAnchor: [0, 24],
  labelAnchor: [-6, 0],
  popupAnchor: [0, -36],
  html: `<span style="${markerHtmlStyles}" />`
})

ipcRenderer.on("mapMyData", function(e, dataIn) {
  data = dataIn;
  console.log(data);
  if (data.length > 0) {
    let centrePoint = getAverageLocation(data);
    options.lat = centrePoint.lat;
    options.lng = centrePoint.lng;
  }

  mymap = L.map("leafmap").setView([options.lat, options.lng], 8);

  L.tileLayer(options.style, {
    maxZoom: 18,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>' //,
    //id: 'mapbox.streets'
  }).addTo(mymap);

  drawLeafMarkers();
});



function drawLeafMarkers() {
  for (record of data) {
    thisMarker = L.marker([record.Latitude, record.Longitude])//,{icon:myIcon}
      .addTo(mymap)
      .bindPopup(record.property_name);

//     if(record[resilientCol] == "TRUE"){
//         resilientStores.push(thisMarker);
//     } else {

//     }
//   }
//   resilientGroup = L.layerGroup(resilientStores);
//   let overlayMaps = {
//       "Resilient": resilientGroup
  }
//   L.control.layers(overlayMaps).addTo(map);
}

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

function mapUpdate() {
  clear();
  for (let record of data) {
    if (record.Latitude && record.Longitude) {
      drawPoint(record);
    }
  }
}
function drawPoint(record, highlighted) {
  let pix = myMap.latLngToPixel(record.Latitude, record.Longitude);
  let zoom = myMap.zoom();
  let baseSize = 8;

  if (record[resilientCol] == "TRUE") {
    stroke(0, 255, 0);
  } else {
    stroke(255, 0, 0);
  }
  if (record["whitelist"] == "ALLOW") {
    fill(255, 255, 255);
  } else if (record["whitelist"] == "DENY") {
    fill(0, 0, 0);
  } else {
    fill(127, 127, 127);
  }

  // if(highlighted){
  //   fill(255, 255, 255);
  //   stroke(0, 0, 0);
  // }

  if (record["user_selected"]) {
    ellipse(pix.x, pix.y, (baseSize + zoom) / 2);
  } else {
    rectMode(CENTER);
    rect(pix.x, pix.y, (baseSize + zoom) / 2, (baseSize + zoom) / 2);
  }

  if (record[columbusCol] == "TRUE") {
    noStroke();
    if (record[resilientCol] == "TRUE") {
      fill(0, 255, 0);
    } else {
      fill(255, 0, 0);
    }
    textAlign(CENTER, CENTER);
    text("C", pix.x, pix.y);
  }
}

function draw() {
  if (initiated && data) {
    let zoom = myMap.zoom();
    for (let record of data) {
      if (record.Latitude && record.Longitude) {
        let pix = myMap.latLngToPixel(record.Latitude, record.Longitude);
        if (dist(mouseX, mouseY, pix.x, pix.y) <= (4 + zoom) / 4) {
          console.log("Close to: " + record.property_name);
          drawPoint(record, true);
        } else {
          drawPoint(record, false);
        }
      }
    }
  }
}
