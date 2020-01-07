'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Common database helper functions.
 */

var DBHelper = function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: 'fetchRestaurants',


    /**
     * Fetch all restaurants.
     */
    value: function fetchRestaurants(callback) {
      localforage.keys().then(function (keys) {
        // An array of all the key names.
        if (keys.filter(function (key) {
          return key == '/restaurants';
        }).length > 0) {
          localforage.getItem('/restaurants').then(function (value) {
            return callback(null, value);
          });
        } else {
          fetch(DBHelper.DATABASE_URL + '/restaurants').then(function (res) {
            return res.json().then(function (data) {
              localforage.setItem('/restaurants', data).then(function () {
                return localforage.getItem('/restaurants');
              }).then(function (value) {
                return callback(null, value);
              });
            });
          }).catch(function (e) {
            return callback('Request failed. Returned status of ' + e.status, null);
          });
        }
      }).catch(function (err) {
        // This code runs if there were any errors
        console.log(err);
      });
    }

    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: 'fetchRestaurantById',
    value: function fetchRestaurantById(id, callback) {
      localforage.keys().then(function (keys) {
        // An array of all the key names.
        if (keys.filter(function (key) {
          return key == '/restaurants/' + id;
        }).length > 0) {

          localforage.getItem('/restaurants/' + id).then(function (value) {
            return callback(null, value);
          });
        } else {
          var promises = [fetch(DBHelper.DATABASE_URL + ('/restaurants/' + id)).then(function (r) {
            return r.json();
          }), fetch(DBHelper.DATABASE_URL + ('/reviews/?restaurant_id=' + id)).then(function (r) {
            return r.json();
          })];
          Promise.all(promises).then(function (data) {
            restaurant = data[0];
            restaurant.reviews = data[1];
            localforage.setItem('/restaurants/' + id, restaurant).then(function () {
              return localforage.getItem('/restaurants/' + id);
            }).then(function (value) {
              return callback(null, value);
            });
          }).catch(function (error) {
            return callback(error, null);
          });
        }
      }).catch(function (err) {
        // This code runs if there were any errors
        console.log(err);
      });
    }
  }, {
    key: 'toggleFavorite',
    value: function toggleFavorite(id, flag, callback) {
      var _this = this;

      if (!navigator.onLine) {
        alert('You are not connected to the internet! Please try again later');
      } else {
        fetch(DBHelper.DATABASE_URL + '/restaurants/' + id + '/?is_favorite=' + flag, {
          method: 'put'
        }).then(function (res) {
          return res.json();
        }).then(function (res) {
          _this.removeCache();
          callback(null, res);
        });
      }
    }
  }, {
    key: 'submitReview',
    value: function submitReview(params, callback) {
      var _this2 = this;

      if (!navigator.onLine) {
        window.addEventListener('online', function () {
          return _this2.submitReview(params, callback);
        });
        alert('Your review has been saved! We will post it when you are connected to the internet');
      } else {
        fetch(DBHelper.DATABASE_URL + '/reviews/', {
          method: 'post',
          body: JSON.stringify({
            'restaurant_id': params.restaurant_id,
            'name': params.name,
            'rating': params.rating,
            'comments': params.comments
          })
        }).then(function (res) {
          return res.json();
        }).then(function (res) {
          _this2.removeCache();
          callback(null, res);
        });
      }
    }
  }, {
    key: 'removeCache',
    value: function removeCache() {
      localforage.clear();
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisine',
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          var results = restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByNeighborhood',
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          var results = restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisineAndNeighborhood',
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var results = restaurants;
          if (cuisine != 'all') {
            // filter by cuisine
            results = results.filter(function (r) {
              return r.cuisine_type == cuisine;
            });
          }
          if (neighborhood != 'all') {
            // filter by neighborhood
            results = results.filter(function (r) {
              return r.neighborhood == neighborhood;
            });
          }
          callback(null, results);
        }
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: 'fetchNeighborhoods',
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          var neighborhoods = restaurants.map(function (v, i) {
            return restaurants[i].neighborhood;
          });
          // Remove duplicates from neighborhoods
          var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
            return neighborhoods.indexOf(v) == i;
          });
          callback(null, uniqueNeighborhoods);
        }
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: 'fetchCuisines',
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          var cuisines = restaurants.map(function (v, i) {
            return restaurants[i].cuisine_type;
          });
          // Remove duplicates from cuisines
          var uniqueCuisines = cuisines.filter(function (v, i) {
            return cuisines.indexOf(v) == i;
          });
          callback(null, uniqueCuisines);
        }
      });
    }

    /**
     * Restaurant page URL.
     */

  }, {
    key: 'urlForRestaurant',
    value: function urlForRestaurant(restaurant) {
      return './restaurant.html?id=' + restaurant.id;
    }

    /**
     * Restaurant image URL.
     */

  }, {
    key: 'imageUrlForRestaurant',
    value: function imageUrlForRestaurant(restaurant) {
      return '/img/' + restaurant.id;
    }

    /**
     * Map marker for a restaurant.
     */

  }, {
    key: 'mapMarkerForRestaurant',
    value: function mapMarkerForRestaurant(restaurant, map) {
      var marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], { title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
      marker.addTo(newMap);
      return marker;
    }
  }, {
    key: 'handleConnectionChange',
    value: function handleConnectionChange(event) {
      if (event.type == 'offline') {
        console.log('You lost connection.');
      }
      if (event.type == 'online') {
        console.log('You are now back online.');
      }

      console.log(new Date(event.timeStamp));
    }
  }, {
    key: 'DATABASE_URL',


    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     * @return {string}
     */
    get: function get() {
      var port = 1337; // Change this to your server port
      return 'http://localhost:' + port;
    }
  }]);

  return DBHelper;
}();
//# sourceMappingURL=dbhelper.js.map
