let restaurants,
  neighborhoods,
  cuisines;
var selectedFilters = {};
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
});

let registerServiceWorker = () => {
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
      reg.installing.addEventListener('statechange', (worker) => {
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
let fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
let fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
let fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
let fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1IjoianNhbGFhdCIsImEiOiJjamtmYXh5dWIwNnN6M2twOWxxZ2U3eW1qIn0.RBDZjhpWCr3Ydl6386E3Fw', {
    mapboxToken: '<your MAPBOX API KEY HERE>',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
let updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  selectedFilters.cuisine = cSelect[cIndex].value;
  selectedFilters.neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(selectedFilters.cuisine, selectedFilters.neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
let resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
let fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  ul.setAttribute('aria-label', `List of ${selectedFilters.cuisine} food within ${selectedFilters.neighborhood} neighborhood`);
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
let createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const pictureEl = document.createElement('picture');
  const sourceEl = document.createElement('source');
  const imgPath = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg', '');

  sourceEl.type = 'image/webp';
  sourceEl['data-srcset'] = `${imgPath}.webp`;
  const sourceJpeg = document.createElement('source');
  sourceJpeg.type = 'image/jpeg';

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = `Image for Restaurant ${restaurant.name}`;
  image.setAttribute('aria-label', `Restaurant ${restaurant.name} image`);

  image['data-src'] = `${imgPath}_400.jpg`;
  image.sizes = '(max-width: 960px) 50vw, 100vw';
  image['data-srcset'] = [`${imgPath}_400.jpg 400w`, `${imgPath}_800.jpg 800w`];
  pictureEl.append(sourceEl);
  pictureEl.append(sourceJpeg);
  pictureEl.append(image);
  inViewport(image, function() {
    sourceEl.setAttribute('srcset', sourceEl['data-srcset']);
    image.setAttribute('srcset', image['data-srcset']);
    image.setAttribute('src', image['data-src']);
  });
  li.append(pictureEl);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const favEl = document.createElement('span');
  if (restaurant.is_favorite == true || restaurant.is_favorite == 'true'){
    favEl.classList.add('favorite-star');
    favEl.innerText = '☆ Favorite';
    name.append(favEl);
  }

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `View restaurant ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
let addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
}

