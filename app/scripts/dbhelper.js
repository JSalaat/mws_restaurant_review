/**
 * Common database helper functions.
 */

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   * @return {string}
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    localforage.keys().then(function (keys) {
      // An array of all the key names.
      if (keys.filter(key => key == '/restaurants').length > 0) {
        localforage.getItem('/restaurants')
          .then((value) => callback(null, value))
      }
      else {
        fetch(`${DBHelper.DATABASE_URL}/restaurants`)
          .then((res) =>
            res.json().then((data) => {
              localforage.setItem('/restaurants', data)
                .then(()=> localforage.getItem('/restaurants'))
                .then((value) => callback(null, value))
            })
          )
          .catch(e => callback((`Request failed. Returned status of ${e.status}`), null));
      }
    }).catch(function (err) {
      // This code runs if there were any errors
      console.log(err);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    localforage.keys().then(function (keys) {
      // An array of all the key names.
      if (keys.filter(key => key == `/restaurants/${id}`).length > 0) {

        localforage.getItem(`/restaurants/${id}`)
          .then((value) => callback(null, value))

      }
      else {
        const promises = [
          fetch(DBHelper.DATABASE_URL + `/restaurants/${id}`).then(r=> r.json()),
          fetch(DBHelper.DATABASE_URL + `/reviews/?restaurant_id=${id}`).then(r=> r.json())
        ];
        Promise.all(promises)
          .then(data => {
            restaurant = data[0];
            restaurant.reviews = data[1];
            localforage.setItem(`/restaurants/${id}`, restaurant)
              .then(()=> localforage.getItem(`/restaurants/${id}`))
              .then((value) => callback(null, value))

          })
          .catch(error => callback(error, null));
      }

    }).catch(function (err) {
      // This code runs if there were any errors
      console.log(err);
    });
  }

  static toggleFavorite(id, flag, callback) {
    if (!navigator.onLine){
      alert('You are not connected to the internet! Please try again later');
    }
    else {
      fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${flag}`, {
        method: 'put'
      }).then(res => res.json())
        .then(res => {
          this.removeCache();
          callback(null, res)
        });
    }
  }

  static submitReview(params, callback) {
    if (!navigator.onLine){
      window.addEventListener('online', () => this.submitReview(params, callback));
      alert('Your review has been saved! We will post it when you are connected to the internet');
    }
    else {
      fetch(`${DBHelper.DATABASE_URL}/reviews/`, {
        method: 'post',
        body: JSON.stringify({
          'restaurant_id': params.restaurant_id,
          'name': params.name,
          'rating': params.rating,
          'comments': params.comments
        })
      }).then(res => res.json())
        .then(res => {
          this.removeCache();
          callback(null, res)
        });
    }
  }

  static removeCache() {
    localforage.clear();
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      })
    marker.addTo(newMap);
    return marker;
  }

  static handleConnectionChange(event){
    if(event.type == 'offline'){
      console.log('You lost connection.');
    }
    if(event.type == 'online'){
      console.log('You are now back online.');
    }

    console.log(new Date(event.timeStamp));
  }

}
