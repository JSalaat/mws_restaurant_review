'use strict';

var restaurants = void 0,
    neighborhoods = void 0,
    cuisines = void 0;
var selectedFilters = {};
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', function (event) {
  initMap();
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
});

var registerServiceWorker = function registerServiceWorker() {
  if (!navigator.serviceWorker) {
    console.warn('[registerServiceWorker] No service worker available in browser.');
  }

  navigator.serviceWorker.register('serviceWorker.js').then(function (reg) {
    if (!navigator.serviceWorker.controller) {
      console.warn('[serviceWorker.register] No controller. Aborting.');
      return;
    }

    if (reg.waiting) {
      console.log('[serviceWorker.register] State::Waiting');
      return;
    }

    if (reg.installing) {
      console.log('[serviceWorker.register] State::Installing');
      reg.installing.addEventListener('statechange', function (worker) {
        if (worker.state === 'installed') {
          console.log('[serviceWorker.register] StateChange::Installed');
        }
      });
      return;
    }
    console.log(reg);
  });
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
var fetchNeighborhoods = function fetchNeighborhoods() {
  DBHelper.fetchNeighborhoods(function (error, neighborhoods) {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
var fillNeighborhoodsHTML = function fillNeighborhoodsHTML() {
  var neighborhoods = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.neighborhoods;

  var select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(function (neighborhood) {
    var option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
var fetchCuisines = function fetchCuisines() {
  DBHelper.fetchCuisines(function (error, cuisines) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
var fillCuisinesHTML = function fillCuisinesHTML() {
  var cuisines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.cuisines;

  var select = document.getElementById('cuisines-select');

  cuisines.forEach(function (cuisine) {
    var option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function () {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1IjoianNhbGFhdCIsImEiOiJjamtmYXh5dWIwNnN6M2twOWxxZ2U3eW1qIn0.RBDZjhpWCr3Ydl6386E3Fw', {
    mapboxToken: '<your MAPBOX API KEY HERE>',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
var updateRestaurants = function updateRestaurants() {
  var cSelect = document.getElementById('cuisines-select');
  var nSelect = document.getElementById('neighborhoods-select');

  var cIndex = cSelect.selectedIndex;
  var nIndex = nSelect.selectedIndex;

  selectedFilters.cuisine = cSelect[cIndex].value;
  selectedFilters.neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(selectedFilters.cuisine, selectedFilters.neighborhood, function (error, restaurants) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
var resetRestaurants = function resetRestaurants(restaurants) {
  // Remove all restaurants
  self.restaurants = [];
  var ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(function (m) {
    return m.setMap(null);
  });
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
var fillRestaurantsHTML = function fillRestaurantsHTML() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  var ul = document.getElementById('restaurants-list');
  ul.setAttribute('aria-label', 'List of ' + selectedFilters.cuisine + ' food within ' + selectedFilters.neighborhood + ' neighborhood');
  restaurants.forEach(function (restaurant) {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
var createRestaurantHTML = function createRestaurantHTML(restaurant) {
  var li = document.createElement('li');
  var pictureEl = document.createElement('picture');
  var sourceEl = document.createElement('source');
  var imgPath = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg', '');

  sourceEl.type = 'image/webp';
  sourceEl['data-srcset'] = imgPath + '.webp';
  var sourceJpeg = document.createElement('source');
  sourceJpeg.type = 'image/jpeg';

  var image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = 'Image for Restaurant ' + restaurant.name;
  image.setAttribute('aria-label', 'Restaurant ' + restaurant.name + ' image');

  image['data-src'] = imgPath + '_400.jpg';
  image.sizes = '(max-width: 960px) 50vw, 100vw';
  image['data-srcset'] = [imgPath + '_400.jpg 400w', imgPath + '_800.jpg 800w'];
  pictureEl.append(sourceEl);
  pictureEl.append(sourceJpeg);
  pictureEl.append(image);
  inViewport(image, function () {
    sourceEl.setAttribute('srcset', sourceEl['data-srcset']);
    image.setAttribute('srcset', image['data-srcset']);
    image.setAttribute('src', image['data-src']);
  });
  li.append(pictureEl);

  var name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  var favEl = document.createElement('span');
  if (restaurant.is_favorite == true || restaurant.is_favorite == 'true') {
    favEl.classList.add('favorite-star');
    favEl.innerText = '☆ Favorite';
    name.append(favEl);
  }

  var neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  var address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  var more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', 'View restaurant ' + restaurant.name);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
var addMarkersToMap = function addMarkersToMap() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  restaurants.forEach(function (restaurant) {
    // Add marker to the map
    var marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
};
//# sourceMappingURL=main.js.map
