'use strict';

var restaurants = void 0,
    neighborhoods = void 0,
    cuisines = void 0;
var selectedFilters = {};
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', function (event) {
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
});

var registerServiceWorker = function registerServiceWorker() {
  if (!navigator.serviceWorker) {
    console.warn('[registerServiceWorker] No service worker available in browser.');
  }

  navigator.serviceWorker.register('scripts/serviceWorker.js').then(function (reg) {
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
  var loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
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
  var imgPath = DBHelper.imageUrlForRestaurant(restaurant).replace(".jpg", "");

  sourceEl.type = 'image/webp';
  sourceEl.srcset = imgPath + '.webp';
  var sourceJpeg = document.createElement('source');
  sourceJpeg.type = 'image/jpeg';

  var image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = 'Image for Restaurant ' + restaurant.name;
  image.setAttribute('aria-label', 'Restaurant ' + restaurant.name + ' image');
  image.src = DBHelper.imageUrlForRestaurant(restaurant).replace(".jpg", "");

  image.src = imgPath + '_800.jpg';
  image.sizes = '(max-width: 960px) 50vw, 100vw';
  image.srcset = [imgPath + '_400.jpg 400w', imgPath + '_800.jpg 800w'];
  pictureEl.append(sourceEl);
  pictureEl.append(sourceJpeg);
  pictureEl.append(image);
  li.append(pictureEl);

  var name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

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
    var marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', function () {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
//# sourceMappingURL=main.js.map
