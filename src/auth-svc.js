/**
 * @module auth-svc
 * @summary: Provides interfaces to change authentication state.
 *
 * @description:
 *
 * Author: justin
 * Created On: 2015-03-21.
 * @license Apache-2.0
 */

'use strict';
// stick an eventListener that listens for all kinds of events.
// when an event you want logged in the app monitor appears, broadcast to the monitor queue.

// could the eventPublisher and the logger be the same thing?
module.exports = function construct(config, authDriver, storage, logger) {
  var m = {};
  config = config ? config : {};
  config = _.defaults(config, {});

  var currentUser = null; //{id:'',token:''};

  var setCurrentUser = function(user) {
    currentUser = user;
    if (user) {
      logger.log('$login', currentUser.id);
      storage.set('user-'+currentUser.id, currentUser);
    } else {
      logger.log('Login Failed.');
    }
    return currentUser;
  };
  /**
   * Returns not-null if login was successful.  Otherwise, it returns the object received in response
   * to calling the login endpoint.
   *
   * @param params
   * @returns {*}
   */
  m.login = function(params) {
    logger.log('Logging In...', params);
    //creds = {key: key, secret: secret};
    return authDriver.login(params)
      .then(function(user) {
        return setCurrentUser(user);
      })
      .catch(function(err) {
        logger.logError('An error occurred attempting to login.', err);
        throw err;
      });
  };

  m.logout = function() {
    return authDriver.logout()
      .then(function() {
        storage.delete('user-'+currentUser.id);
        logger.log('$logout', currentUser.id);
        currentUser = null;
      })
      .catch(function(err) {
        logger.logError(err);
        throw err;
      })
  };

  m.currentIdentity = function(userId) {
    if (userId) {
      var user = storage.get('user-'+userId);
      if (user) {
        currentUser = user;
      }
    } else {
      return currentUser;
    }
  };

  m.refreshAuth = function(userId) {
    var user = storage.get('user-'+userId);
    if (user) {
      return authDriver.reauthenticate(user)
        .then(function(user) {
          return setCurrentUser(user);
        });
    }
  };

  return m;
};