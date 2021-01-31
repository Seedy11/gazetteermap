$(document).ready(function(){

var map = L.map('map', {zoomControl:false}).fitWorld();

var lng = 0;
var lat = 0;
var area = 0;
var country = "";
var capital = "";
var locationMarker;
var bounds;

var locationIcon = L.icon({
    iconUrl: "libs/img/location.png",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -10]
});

var polyStyle = {
    "color": "yellow",
    "weight": 3,
    "opacity": 0.9
};

L.tileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
}).addTo(map);





L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
       {
       attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
       maxZoom: 20,
       id: 'mapbox/streets-v11',
       tileSize: 512,
       zoomOffset: -1,
       accessToken: 'pk.eyJ1IjoiYmVyYXMxOTg2IiwiYSI6ImNrZGs5ZW91bTBtZjAyeXAzdnljbjc0NHoifQ.BP5Dkg-N7GjlLSo8_SUSyw'
       }).addTo(map);



function onLocationFound(e) {
                var res = e
                console.log(res);
                $.ajax({
                    url: "libs/php/userlatlng.php",
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        lat: res['latlng']['lat'],
                        lng: res['latlng']['lng']
                    },
                      success: function(result){
                                   console.log(result);
                                 	setFlag(result['data']['countryCode']);
                                   $.ajax({
                                       url: "libs/php/getCountryInfo.php",
                                       type: 'POST',
                                       dataType: 'json',
                                       data: {
                                           country: result['data']['countryCode'],
                                           lang: 'en'
                                       },
                                       success: function(result){
                                           console.log(result);
                                           if(result.status.code == 200){
                                              setCountryInfo(result);
                                           }
                                       },
                                       error: function(jqXHR, textStatus, errorThrown){
                                           alert(`${textStatus} error in country info`);
                                       }
                                   });
                               },
                               error: function(jqXHR, textStatus, errorThrown){
                                   alert(`${textStatus} error in country info`);
                               }
                           });
                        }



    // Error handler
    function onLocationError(e) {
        alert(e.message);
    }

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    map.locate({setView: false, maxZoom: 10});

function setCountryInfo(result) {
    //showInfoBtn();
    $('#continent').html(result['data'][0]['continent']);
    capital = result['data'][0]['capital'];
    currency = result['data'][0]['currencyCode'];
    country = result['data'][0]['isoAlpha3'];
  	setCountry(result['data'][0]['countryName'])
    $('#capital').html(capital);
    $('#languages').html(result['data'][0]['languages']);
    //$('#population').html(formatPopulation(result['data'][0]['population']));
    $('#population').html(result['data'][0]['population']);
    $('#currency').html(currency)
    lng = (result['data'][0]['north'] + result['data'][0]['south']) / 2;
    lat = (result['data'][0]['east'] + result['data'][0]['west']) / 2;
    $('#area').html(`${formatArea(result['data'][0]['areaInSqKm'])} km<sup>2</sup>`);
    getWeather(lng, lat);
    getGeoJson(country);
}

function setWeatherInfo(data){
    // Going to set the weather information here from the results in line 114
    $('#temperature').html(data['main']['temp']);
    $('#humidity').html(data['main']['humidity']);
    $('#pressure').html(data['main']['pressure']);
}


function onMapClick(e) {
    onLocationFound(e)
}

map.on('click', onMapClick);

// Handles country selection option event
$('#selectCountry').change(function(){
    showInfoBtn();
    emptyTable('#table2');
      $.ajax({
        url: "libs/php/getCountryInfo.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: $('#selectCountry').val(),
            lang: 'en'
        },
        success: function(result){
            console.log(result);
            if(result.status.code == 200){
               setFlag($('#selectCountry').val());
               setCountryInfo(result);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`${textStatus} error in country info`);
        }
    });
});



  $("#btnInfo").click(function(){
    $("#table1").slideToggle("slow");
    $('#map').width('100%')
  });
  
  

async function getWeather(reslng, reslat) {
    await $.ajax({
        url: "libs/php/getWeather.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lng: reslng.toString(),
            lat: reslat.toString(),
            lang: 'en',
            q: 'capital'
        },
        success: function(result){

            console.log(result);

            if(result.status.code == 200){
                setWeatherInfo(result['data']);
                lng = result['data']['coord']['lon'];
                lat = result['data']['coord']['lat'];
                updateMarker(result['data']['coord']['lon'], result['data']['coord']['lat']);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`${textStatus} error in geolocation`);
        }
    });
}
// get specific country border data from geojson file
function getGeoJson(countryCode) {
   $.ajax({
       url: "libs/php/countries.geojson",
       type: 'GET',
       dataType: 'json',
       success: function(result){
           console.log(result);
           if(result){
               console.log(result);
               if(bounds != undefined){
                           map.removeLayer(bounds);
                      }
                      bounds = L.geoJSON(result, {
                          style: polyStyle,
                          filter: function(feature){
                              return feature.properties.ISO_A3 == countryCode
                          }
                        }).addTo(map);
                        map.fitBounds(bounds.getBounds());
                      locationMarker.bindPopup(`Capital: ${capital}`).openPopup();
           }
       },
       error: function(jqXHR, textStatus, errorThrown){
           alert(`Error in geojson: ${textStatus} ${errorThrown} ${jqXHR}`);
       }
   });
}
 
function updateMarker(lng, lat){
    if(locationMarker != undefined){
        map.removeLayer(locationMarker);
    }
    locationMarker = L.marker([lng, lat], {icon: locationIcon}).addTo(map);
};

function emptyTable(tabID) {
   $(tabID).empty();
}



function showInfoBtn() {
   $('#btnInfo').css("display", "block");
}


function formatArea(num){
   let area = Number(num).toPrecision();
   if(area/1000000 > 1){
       return `${(area/1000000).toFixed(2)} mln`;
   }else if(area/1000 > 1) {
       return `${(area/1000).toFixed(2)} k`
   }else {
       return `${area}`;
   }
 } 

function setCountry(countryName) {
   $('#country-name').html(countryName);
}

function setFlag(iso2code) {
   $('#country-flag').html(`<img src=" + result[1]['flag']></img>`);
}


});
