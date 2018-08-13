const electron = require("electron");
const { ipcRenderer } = electron;
const bootstrap = require("bootstrap"); //required even though not called!!
var $ = require("jquery");

var uluru = { lat: -25.344, lng: 131.036 };


let currentMode;
let currentFilters;

let sqlResults;

// The map, centered at Uluru
let gmap;
let markers = [];
let infowindows = [];

let options = {
  lat: 52.9271382,
  lng: -1.1862859,
  zoom: 6,
  style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
};

ipcRenderer.on("mapMyData", function(e, dataIn, mode, filters) {
  currentMode = mode;
  currentFilters = filters;
  sqlResults = dataIn;
  console.log(sqlResults);
  // let data = sqlResults.recordset
  // console.log(data);
  if (sqlResults.recordset.length > 0) {
    let centrePoint = getAverageLocation(sqlResults.recordset);
    options.lat = centrePoint.lat;
    options.lng = centrePoint.lng;
  }
  for (record of sqlResults.recordset) {
    if (!record.user_selected) {
      record.user_selected = false;
    }
  }

  gmap = new google.maps.Map(document.getElementById("gmap"), {
    zoom: options.zoom,
    center: { lat: options.lat, lng: options.lng }
  });
  drawGoogleMarkers();
  //var marker = new google.maps.Marker({position: test, map: map});
  //console.log(gmap);
  //console.log(markers);
});

function toggleSelect(e) {
  let storenum = e.value;
  //let data = sqlResults.recordset
  for (record of sqlResults.recordset) {
    if (record.Property_id == storenum) {
      record.user_selected = !record.user_selected;
      break;
    }
  }
  console.log(sqlResults);
  ipcRenderer.send("selectedFromMap", sqlResults);
}

function closeInfowindow(e) {
  let storenum = e.value;
  for (info of infowindows) {
    if (info.id == storenum) {
      info.close();
    }
  }
}

function animate(marker) {
  if (marker.data.user_selected) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  } else {
    marker.setAnimation(null);
  }
}

function drawGoogleMarkers() {
  for(marker of markers){
    marker.setMap(null);
  }
  markers = [];
  infowindows = [];
  //let data = sqlResults.recordset
  for (record of sqlResults.recordset) {
    if (record.Latitude && record.Longitude) {
      if (
        currentMode == "ALL" ||
        (currentMode == "SELECTED" && record.user_selected) ||
        (currentMode == "FILTERED" &&
          ((record.Columbus == "TRUE" || !currentFilters.ChkColOnly) &&
            (record.Resilient == "TRUE" || !currentFilters.ChkResOnly)))
      ) {
        let infowindow = new google.maps.InfoWindow({
          content:
            record.Property_id +
            " - " +
            record.property_name +
            "<br>Resilient: " +
            record.Resilient +
            "<br>Columbus: " +
            record.Columbus +
            '<br>Selected: ' + record.user_selected + ' <button value="' +
            record.Property_id +
            '" onclick="toggleSelect(this);closeInfowindow(this);drawGoogleMarkers()">Toggle</button>',
          id: record.Property_id
        });


        let blackBorder = "#000000";
        let whiteBorder = "#d6e3e0";

        let greenBackground = "#38a71b";
        let redBackground = "#712929";
        let blueBackground = "#122c95";

        let tickFill = "#1b9fa7";
        let tickLine = "#d1e0dd";
        let crossFill = "#ff0000";
        let crossLine = "#ff8080";

        let selectedBorder;
        if (record.Columbus == "TRUE") {
          selectedBorder = whiteBorder;
        } else {
          selectedBorder = blackBorder;
        }

        let selectedBackground
        if(record.Resilient == "TRUE") {
          selectedBackground = greenBackground;
        } else {
          selectedBackground = redBackground;
        }

        let markerCross = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M24.75 19.91L33.23 28.14L28.48 32.74L20 24.51L11.52 32.74L6.77 28.14L15.25 19.91L6.77 11.68L11.52 7.07L20 15.3L28.48 7.07L33.23 11.68L24.75 19.91Z" id="a7IBIBDBMl"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="${selectedBackground}" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="${selectedBorder}" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill="${crossFill}" fill-opacity="1"></use><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill-opacity="0" stroke="${crossLine}" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>`;
        let markerTick = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M21.73 28.01L21.73 28.01L16.74 33.15L7.5 23.64L12.49 18.5L16.74 22.88L29.43 9.82L34.42 14.96L21.73 28.01Z" id="a3xD1n0qa"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="${selectedBackground}" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="${selectedBorder}" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a3xD1n0qa" opacity="1" fill="${tickFill}" fill-opacity="1"></use><g><use xlink:href="#a3xD1n0qa" opacity="1" fill-opacity="0" stroke="${tickLine}" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>`;
        let markerBlank = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="${selectedBackground}" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="${selectedBorder}" stroke-width="2" stroke-opacity="1"></use></g></g><g id="a40OuMUeUo"><use xlink:href="#b2bfvA2Xln" opacity="1" fill="#e07400" fill-opacity="1"></use><g><use xlink:href="#b2bfvA2Xln" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>`;

        let selectedMarker;
        if(record.whitelist =="ALLOW") {
          selectedMarker = markerTick;
        } else if (record.whitelist =="DENY"){
          selectedMarker = markerCross;
        } else {
          selectedMarker = markerBlank;
        }

        let marker = new google.maps.Marker({
          data: record,
          position: {
            lat: parseFloat(record.Latitude),
            lng: parseFloat(record.Longitude)
          },
          //label: "A",//String(record.Property_id),
          //icon: 'http://maps.google.com/mapfiles/ms/icons/green.png',
          icon: {
            //fillColor:"green",
            //fillOpacity: 1,
            url: 'data:image/svg+xml;charset=UTF-8;base64,' + btoa(selectedMarker),
            //strokeColor: "red",
            //scale: 0.1,
            //scaledSize: new google.maps.Size(30, 55),
            anchor: new google.maps.Point(20, 53),
            labelOrigin: new google.maps.Point(0, -28)
          },
          //map: gmap
        });

        marker.addListener("click", function() {
          infowindow.open(gmap, marker);
        });
        markers.push(marker);
        infowindows.push(infowindow);
        //console.log(marker);
        
      }
    }
  }
  for(marker of markers){
    marker.setMap(gmap);
    animate(marker);
  }
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


// let markerWhiteGreenCross = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M24.75 19.91L33.23 28.14L28.48 32.74L20 24.51L11.52 32.74L6.77 28.14L15.25 19.91L6.77 11.68L11.52 7.07L20 15.3L28.48 7.07L33.23 11.68L24.75 19.91Z" id="a7IBIBDBMl"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="'+ selectedBackground +'" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#d6e3e0" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill="#e13030" fill-opacity="1"></use><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill-opacity="0" stroke="#e15c62" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerWhiteGreenTick = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M21.73 28.01L21.73 28.01L16.74 33.15L7.5 23.64L12.49 18.5L16.74 22.88L29.43 9.82L34.42 14.96L21.73 28.01Z" id="a3xD1n0qa"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#38a71b" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#d6e3e0" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a3xD1n0qa" opacity="1" fill="'+ tickFill +'" fill-opacity="1"></use><g><use xlink:href="#a3xD1n0qa" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerWhiteGreenBlank = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#38a71b" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#d6e3e0" stroke-width="2" stroke-opacity="1"></use></g></g><g id="a40OuMUeUo"><use xlink:href="#b2bfvA2Xln" opacity="1" fill="#e07400" fill-opacity="1"></use><g><use xlink:href="#b2bfvA2Xln" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>`;
// let markerWhiteRedCross = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M24.75 19.91L33.23 28.14L28.48 32.74L20 24.51L11.52 32.74L6.77 28.14L15.25 19.91L6.77 11.68L11.52 7.07L20 15.3L28.48 7.07L33.23 11.68L24.75 19.91Z" id="a7IBIBDBMl"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#712929" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#d6e3e0" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill="#e13030" fill-opacity="1"></use><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill-opacity="0" stroke="#e15c62" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerWhiteRedTick = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M21.73 28.01L21.73 28.01L16.74 33.15L7.5 23.64L12.49 18.5L16.74 22.88L29.43 9.82L34.42 14.96L21.73 28.01Z" id="a3xD1n0qa"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#712929" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#d6e3e0" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a3xD1n0qa" opacity="1" fill="#1b9fa7" fill-opacity="1"></use><g><use xlink:href="#a3xD1n0qa" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerWhiteRedBlank = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#712929" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#d6e3e0" stroke-width="2" stroke-opacity="1"></use></g></g><g id="a40OuMUeUo"><use xlink:href="#b2bfvA2Xln" opacity="1" fill="#e07400" fill-opacity="1"></use><g><use xlink:href="#b2bfvA2Xln" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>`;
// let markerWhiteBlueCross = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M24.75 19.91L33.23 28.14L28.48 32.74L20 24.51L11.52 32.74L6.77 28.14L15.25 19.91L6.77 11.68L11.52 7.07L20 15.3L28.48 7.07L33.23 11.68L24.75 19.91Z" id="a7IBIBDBMl"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#122c95" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#d6e3e0" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill="#e13030" fill-opacity="1"></use><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill-opacity="0" stroke="#e15c62" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerWhiteBlueTick = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M21.73 28.01L21.73 28.01L16.74 33.15L7.5 23.64L12.49 18.5L16.74 22.88L29.43 9.82L34.42 14.96L21.73 28.01Z" id="a3xD1n0qa"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#122c95" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#d6e3e0" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a3xD1n0qa" opacity="1" fill="#1b9fa7" fill-opacity="1"></use><g><use xlink:href="#a3xD1n0qa" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerWhiteBlueBlank = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#122c95" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#d6e3e0" stroke-width="2" stroke-opacity="1"></use></g></g><g id="a40OuMUeUo"><use xlink:href="#b2bfvA2Xln" opacity="1" fill="#e07400" fill-opacity="1"></use><g><use xlink:href="#b2bfvA2Xln" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>`;



// let markerBlackGreenCross = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M24.75 19.91L33.23 28.14L28.48 32.74L20 24.51L11.52 32.74L6.77 28.14L15.25 19.91L6.77 11.68L11.52 7.07L20 15.3L28.48 7.07L33.23 11.68L24.75 19.91Z" id="a7IBIBDBMl"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#38a71b" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill="#e13030" fill-opacity="1"></use><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill-opacity="0" stroke="#e15c62" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerBlackGreenTick = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M21.73 28.01L21.73 28.01L16.74 33.15L7.5 23.64L12.49 18.5L16.74 22.88L29.43 9.82L34.42 14.96L21.73 28.01Z" id="a3xD1n0qa"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#38a71b" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a3xD1n0qa" opacity="1" fill="#1b9fa7" fill-opacity="1"></use><g><use xlink:href="#a3xD1n0qa" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerBlackGreenBlank = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#38a71b" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="2" stroke-opacity="1"></use></g></g><g id="a40OuMUeUo"><use xlink:href="#b2bfvA2Xln" opacity="1" fill="#e07400" fill-opacity="1"></use><g><use xlink:href="#b2bfvA2Xln" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>`;
// let markerBlackRedCross = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M24.75 19.91L33.23 28.14L28.48 32.74L20 24.51L11.52 32.74L6.77 28.14L15.25 19.91L6.77 11.68L11.52 7.07L20 15.3L28.48 7.07L33.23 11.68L24.75 19.91Z" id="a7IBIBDBMl"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#712929" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill="#e13030" fill-opacity="1"></use><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill-opacity="0" stroke="#e15c62" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerBlackRedTick = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M21.73 28.01L21.73 28.01L16.74 33.15L7.5 23.64L12.49 18.5L16.74 22.88L29.43 9.82L34.42 14.96L21.73 28.01Z" id="a3xD1n0qa"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#712929" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a3xD1n0qa" opacity="1" fill="#1b9fa7" fill-opacity="1"></use><g><use xlink:href="#a3xD1n0qa" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerBlackRedBlank = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#712929" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="2" stroke-opacity="1"></use></g></g><g id="a40OuMUeUo"><use xlink:href="#b2bfvA2Xln" opacity="1" fill="#e07400" fill-opacity="1"></use><g><use xlink:href="#b2bfvA2Xln" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>`;
// let markerBlackBlueCross = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M24.75 19.91L33.23 28.14L28.48 32.74L20 24.51L11.52 32.74L6.77 28.14L15.25 19.91L6.77 11.68L11.52 7.07L20 15.3L28.48 7.07L33.23 11.68L24.75 19.91Z" id="a7IBIBDBMl"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#122c95" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill="#e13030" fill-opacity="1"></use><g><use xlink:href="#a7IBIBDBMl" opacity="1" fill-opacity="0" stroke="#e15c62" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerBlackBlueTick = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path><path d="M21.73 28.01L21.73 28.01L16.74 33.15L7.5 23.64L12.49 18.5L16.74 22.88L29.43 9.82L34.42 14.96L21.73 28.01Z" id="a3xD1n0qa"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#122c95" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="2" stroke-opacity="1"></use></g></g><g><use xlink:href="#a3xD1n0qa" opacity="1" fill="#1b9fa7" fill-opacity="1"></use><g><use xlink:href="#a3xD1n0qa" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>';
// let markerBlackBlueBlank = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 55" width="40" height="55"><defs><path d="M39 19.65C39 9.35 30.49 1 20 1C9.51 1 1 9.35 1 19.65C1 29.95 9.51 38.3 20 54C30.49 38.3 39 29.95 39 19.65Z" id="d1ECZFYn7A"></path></defs><g><g><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill="#122c95" fill-opacity="1"></use><g><use xlink:href="#d1ECZFYn7A" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="2" stroke-opacity="1"></use></g></g><g id="a40OuMUeUo"><use xlink:href="#b2bfvA2Xln" opacity="1" fill="#e07400" fill-opacity="1"></use><g><use xlink:href="#b2bfvA2Xln" opacity="1" fill-opacity="0" stroke="#d1e0dd" stroke-width="1" stroke-opacity="1"></use></g></g></g></g></svg>`;




// let markerStyles = {
// markerWhiteGreenCross,
// markerWhiteGreenTick,
// markerWhiteGreenBlank,
// markerWhiteRedCross,
// markerWhiteRedTick,
// markerWhiteRedBlank,
// markerWhiteBlueCross,
// markerWhiteBlueTick,
// markerWhiteBlueBlank,
// markerBlackGreenCross,
// markerBlackGreenTick,
// markerBlackGreenBlank,
// markerBlackRedCross,
// markerBlackRedTick,
// markerBlackRedBlank,
// markerBlackBlueCross,
// markerBlackBlueTick,
// markerBlackBlueBlank,
// }
// console.log(markerStyles);