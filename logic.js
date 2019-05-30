// Store the API endpoint inside queryUrl
//var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var platesJSON = "PB2002_plates.json" ;


var markerSize = 0.0;


// Perform a GET request to the query URL to get the earthquake data
d3.json(queryUrl, function(data) {
  //get the tectonic plate data
  d3.json(platesJSON, function(data2) {
    createFeatures(data.features, data2.features);
  })
});


//return color based on value
  function getColor(x) {
    return x > 5 ? "#f40202" :
           x > 4 ? "#f45f02" :
           x > 3 ? "#f49702" :
           x > 2 ? "#F4bc02" :
           x > 1 ? "#d8f402" :
           x > 0 ? "#93f402" :
                "#FFEDA0";
  }


  function createFeatures(earthquakeData, plateData) {


  // style function
  function style(feature) {
  	return {
      color: "black",
      fillColor: getColor(feature.properties.mag),
      fillOpacity: 0.85,
      opacity: 1,
      weight: 1,
  		stroke: true,
      radius: +feature.properties.mag*4.5
  	};
  }

    // Create a GeoJSON layer containing the features array on the earthquakeData object
    // Run the onEachFeature function once for each piece of data in the array
    var earthquakes = L.geoJson(earthquakeData, {

            pointToLayer: function(feature, latlng) {

               //console.log("markersize: "+markerSize);
                //return L.circleMarker(latlng,  geojsonMarkerOptions );
                return L.circleMarker(latlng,  style(feature) );
            },
            onEachFeature: function (feature, layer) {
                //console.log("place: " + feature.properties.place);
                layer.bindPopup("<h3>" + feature.properties.place + "<hr>Magnitude: "
                + +feature.properties.mag + "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
            }

        //console.log(earthquakes);

    });

    var plates = L.geoJson(plateData, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup("<h3>" + feature.properties.PlateName + "</h3>");
      }
    });


  // Sending the earthquakes layer to the createMap function
  createMap(earthquakes, plates);
}



function createMap(earthquakes, plates) {

  // Define streetmap and darkmap layers
  var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1IjoicmljaGFyZGt5dSIsImEiOiJjanZlZXA0a3cwbjVmM3lwNnYza2VobTY3In0.dng4QqqBvYvMznCcg5HG2A" );


  var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1IjoicmljaGFyZGt5dSIsImEiOiJjanZlZXA0a3cwbjVmM3lwNnYza2VobTY3In0.dng4QqqBvYvMznCcg5HG2A" );

  var satmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
      "access_token=pk.eyJ1IjoicmljaGFyZGt5dSIsImEiOiJjanZlZXA0a3cwbjVmM3lwNnYza2VobTY3In0.dng4QqqBvYvMznCcg5HG2A" );


  // Define a baseMaps object to hold the base layers
  var baseMaps = {
    "Street Map": streetmap,
    "Dark Map": darkmap,
    "Satellite Map": satmap,
  };

  // Create overlay object to hold the overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes,
    Plates: plates,
  };

  // Create the map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    timeDimension: true,
    timeDimensionOptions: {
      timeInterval : "P1W/today",
      period: "P2D",
      autoPlay: true
    },
    timeDimensionControl: true,
    timeDimensionControlOptions: {
      loopButton: true,
      autoPlay: true
    },
    layers: [streetmap, earthquakes, plates]
  });

  // Create a layer control
  // Pass in the baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);



//add time timeDimension
//based on example from: http://jsfiddle.net/bielfrontera/5afucs89/
L.TimeDimension.Layer.GeoJson.GeometryCollection = L.TimeDimension.Layer.GeoJson.extend({
  // Do not modify features. Just return the feature if it intersects the time interval
  _getFeatureBetweenDates: function(feature, minTime, maxTime) {
    var time = new Date(feature.properties.time);
      if (time > maxTime || time < minTime) {
          return null;
      }
      return feature;
  }
});
var timeLayer = L.timeDimension.layer.geoJson.geometryCollection = function(layer, options) {
  return new L.TimeDimension.Layer.GeoJson.GeometryCollection(layer, options);
};


//L.timeDimension.layer.geoJson(layer).addTo(myMap);


geoJsonTimeLayer = L.timeDimension.layer.geoJson.geometryCollection(earthquakes, {
  updateTimeDimension: true,
  updateTimeDimensionMode: 'replace',
  duration: 'PT1H',
}).addTo(myMap);


//add legend
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1, 2, 3, 4, 5],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(myMap);

}
