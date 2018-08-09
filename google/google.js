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
      // for (marker of markers) {
      //   if (marker.data.Property_id == record.Property_id) {
      //     marker.data.user_selected = record.user_selected;
      //     animate(marker);

      //     for(info of infowindows){
      //       if(info.id == record.Property_id){
      //         info.content = record.Property_id +
      //         " - " +
      //         record.property_name +
      //         "<br>Resilient: " +
      //         record.Resilient +
      //         "<br>Columbus: " +
      //         record.Columbus +
      //         '<br>Selected: ' + record.user_selected + ' <button value="' +
      //         record.Property_id +
      //         '" onclick="toggleSelect(this);closeInfowindow(this);">Toggle</button>';
      //         marker.addListener("click", function() {
      //           info.open(gmap, marker);
      //         });
      //         break;
      //       }
      //     }
      //     break;
      //   }
      // }
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

        let marker = new google.maps.Marker({
          data: record,
          position: {
            lat: parseFloat(record.Latitude),
            lng: parseFloat(record.Longitude)
          },
          //label: "A",//String(record.Property_id),
          //icon: 'http://maps.google.com/mapfiles/ms/icons/green.png',
          // icon: {
          //   path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',//google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          //   fillColor:"green",
          //   fillOpacity: 1,
          //   strokeColor: "red",
          //   scale: 1.25,
          //   labelOrigin: new google.maps.Point(0, -28)
          // },
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
