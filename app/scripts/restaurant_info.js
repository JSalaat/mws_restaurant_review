let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
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
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
let fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
let fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;


  const favEl = document.createElement('button');
  //const favBtn = document.getElementById('mark-fav');
  if (restaurant.is_favorite == true || restaurant.is_favorite == 'true'){
    favEl.id = 'favorite';
    favEl.innerText = '☆ FAVORITE';
    name.append(favEl);

    favEl.onclick = () => toggleFavorite('false');
  }
  else {
    favEl.id = 'not-favorite';
    favEl.innerText = 'Mark As Favorite';
    name.append(favEl);
    favEl.onclick = () => toggleFavorite('true');
  }

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  const pictureEl = document.createElement('picture');
  const sourceEl = document.createElement('source');
  const imgPath = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg', '');

  sourceEl.type = 'image/webp';
  sourceEl.srcset = `${imgPath}.webp`;
  const sourceJpeg = document.createElement('source');
  sourceJpeg.type = 'image/jpeg';

  const imageDiv = document.getElementById('restaurant-img');
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = `Image for Restaurant ${restaurant.name}`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg', '');

  image.src = `${imgPath}_800.jpg`;
  image.sizes = '(max-width: 960px) 50vw, 100vw';
  image.srcset = [`${imgPath}_400.jpg 400w`, `${imgPath}_800.jpg 800w`];
  pictureEl.append(sourceEl);
  pictureEl.append(sourceJpeg);
  pictureEl.append(image);
  imageDiv.append(pictureEl);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
let fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
let fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
let createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = `<b>${review.name}</b> wrote on ${new Date(review.createdAt).toGMTString()}`;
  li.appendChild(name);

  const comments = document.createElement('blockquote');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  const rating = document.createElement('p');
  rating.className = 'ratings-el'
  rating.innerHTML = `Rating: ${review.rating}<b>☆</b>`;
  li.appendChild(rating);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
let fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.setAttribute('aria-current', restaurant.name);
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
let getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Post new review.
 */
let submitReview = () => {
  let data = {
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
let toggleFavorite = (flag) => {
  DBHelper.toggleFavorite(restaurant.id, flag, function (err, res) {
    if (err) throw err;
    console.log(res);
    window.location.reload(false);
    //fillRestaurantHTML(res);
  });
};
