const electron = require("electron");
const { ipcRenderer } = electron;
const bootstrap = require("bootstrap"); //required even though not called!!
var $ = require("jquery");

var uluru = { lat: -25.344, lng: 131.036 };

// The map, centered at Uluru
let gmap;

let options = {
  lat: 52.9271382,
  lng: -1.1862859,
  zoom: 6,
  style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
};

ipcRenderer.on("mapMyData", function(e, dataIn) {
  data = dataIn;
  console.log(data);
  if (data.length > 0) {
    let centrePoint = getAverageLocation(data);
    options.lat = centrePoint.lat;
    options.lng = centrePoint.lng;
  }

  gmap = new google.maps.Map(document.getElementById("gmap"), {
    zoom: options.zoom,
    center: { lat: options.lat, lng: options.lng }
  });
  drawGoogleMarkers();
  //var marker = new google.maps.Marker({position: test, map: map});
  console.log(gmap);
});

function drawGoogleMarkers() {
  for (record of data) {
    if (record.Latitude && record.Longitude) {
      let infowindow = new google.maps.InfoWindow({
        content: record.property_name
      });

      let marker = new google.maps.Marker({
        position: {
          lat: parseFloat(record.Latitude),
          lng: parseFloat(record.Longitude)
        },
        //label: record.property_name,
        map: gmap
      });

      marker.addListener("click", function() {
        infowindow.open(gmap, marker);
      });
      
      console.log(marker);
    }
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
