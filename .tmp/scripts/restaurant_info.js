'use strict';

var restaurant = void 0;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', function (event) {
  initMap();
});

/**
 * Initialize leaflet map
 */
window.initMap = function () {
  fetchRestaurantFromURL(function (error, restaurant) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1IjoianNhbGFhdCIsImEiOiJjamtmYXh5dWIwNnN6M2twOWxxZ2U3eW1qIn0.RBDZjhpWCr3Ydl6386E3Fw', {
        mapboxToken: '<your MAPBOX API KEY HERE>',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
var fetchRestaurantFromURL = function fetchRestaurantFromURL(callback) {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  var id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, function (error, restaurant) {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
var fillRestaurantHTML = function fillRestaurantHTML() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  var favEl = document.createElement('button');
  //const favBtn = document.getElementById('mark-fav');
  if (restaurant.is_favorite == true || restaurant.is_favorite == 'true') {
    favEl.id = 'favorite';
    favEl.innerText = '☆ FAVORITE';
    name.append(favEl);

    favEl.onclick = function () {
      return toggleFavorite('false');
    };
  } else {
    favEl.id = 'not-favorite';
    favEl.innerText = 'Mark As Favorite';
    name.append(favEl);
    favEl.onclick = function () {
      return toggleFavorite('true');
    };
  }

  var address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  var pictureEl = document.createElement('picture');
  var sourceEl = document.createElement('source');
  var imgPath = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg', '');

  sourceEl.type = 'image/webp';
  sourceEl.srcset = imgPath + '.webp';
  var sourceJpeg = document.createElement('source');
  sourceJpeg.type = 'image/jpeg';

  var imageDiv = document.getElementById('restaurant-img');
  var image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = 'Image for Restaurant ' + restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg', '');

  image.src = imgPath + '_800.jpg';
  image.sizes = '(max-width: 960px) 50vw, 100vw';
  image.srcset = [imgPath + '_400.jpg 400w', imgPath + '_800.jpg 800w'];
  pictureEl.append(sourceEl);
  pictureEl.append(sourceJpeg);
  pictureEl.append(image);
  imageDiv.append(pictureEl);

  var cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
var fillRestaurantHoursHTML = function fillRestaurantHoursHTML() {
  var operatingHours = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.operating_hours;

  var hours = document.getElementById('restaurant-hours');
  for (var key in operatingHours) {
    var row = document.createElement('tr');

    var day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    var time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
var fillReviewsHTML = function fillReviewsHTML() {
  var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.reviews;

  var container = document.getElementById('reviews-container');
  var title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    var noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  var ul = document.getElementById('reviews-list');
  reviews.forEach(function (review) {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
var createReviewHTML = function createReviewHTML(review) {
  var li = document.createElement('li');
  var name = document.createElement('p');
  name.innerHTML = '<b>' + review.name + '</b> wrote on ' + new Date(review.createdAt).toGMTString();
  li.appendChild(name);

  var comments = document.createElement('blockquote');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  var rating = document.createElement('p');
  rating.className = 'ratings-el';
  rating.innerHTML = 'Rating: ' + review.rating + '<b>\u2606</b>';
  li.appendChild(rating);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
var fillBreadcrumb = function fillBreadcrumb() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var breadcrumb = document.getElementById('breadcrumb');
  var li = document.createElement('li');
  li.setAttribute('aria-current', restaurant.name);
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
var getParameterByName = function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Post new review.
 */
var submitReview = function submitReview() {
  var data = {
    'restaurant_id': restaurant.id,
    'name': document.getElementById('review-form-elem').elements['name'].value,
    'rating': document.getElementById('review-form-elem').elements['rating'].value,
    'comments': document.getElementById('review-form-elem').elements['comments'].value
  };
  DBHelper.submitReview(data, function (err, res) {
    if (err) throw err;
    console.log(res);
    window.location.reload(false);
  });
};
/**
 * mark as favorite.
 */
var toggleFavorite = function toggleFavorite(flag) {
  DBHelper.toggleFavorite(restaurant.id, flag, function (err, res) {
    if (err) throw err;
    console.log(res);
    window.location.reload(false);
    //fillRestaurantHTML(res);
  });
};
//# sourceMappingURL=restaurant_info.js.map
