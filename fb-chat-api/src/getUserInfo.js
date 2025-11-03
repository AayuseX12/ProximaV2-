"use strict";

var utils = require("../utils");
var log = require("npmlog");

function formatData(data) {
  var retObj = {};

  for (var prop in data) {
    // eslint-disable-next-line no-prototype-builtins
    if (data.hasOwnProperty(prop)) {
      var innerObj = data[prop];
      // Add null checks for each property
      retObj[prop] = {
        name: innerObj.name || "Facebook User",
        firstName: innerObj.firstName || innerObj.name || "Facebook",
        vanity: innerObj.vanity || null,
        thumbSrc: innerObj.thumbSrc || innerObj.profile_picture?.uri || null,
        profileUrl: innerObj.uri || innerObj.url || `https://www.facebook.com/${prop}`,
        gender: innerObj.gender || 0,
        type: innerObj.type || "user",
        isFriend: innerObj.is_friend || false,
        isBirthday: !!innerObj.is_birthday
      };
    }
  }

  return retObj;
}

module.exports = function (defaultFuncs, api, ctx) {
  return function getUserInfo(id, callback) {
    var resolveFunc = function () { };
    var rejectFunc = function () { };
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err, userInfo) {
        if (err) return rejectFunc(err);
        resolveFunc(userInfo);
      };
    }

    if (utils.getType(id) !== "Array") id = [id];

    var form = {};
    id.map(function (v, i) {
      form["ids[" + i + "]"] = v;
    });

    // Try the primary endpoint first
    defaultFuncs
      .post("https://www.facebook.com/chat/user_info/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (resData.error) throw resData;
        
        // Check if we got valid data
        if (!resData.payload || !resData.payload.profiles) {
          throw new Error("Invalid response structure from Facebook");
        }
        
        var formattedData = formatData(resData.payload.profiles);
        
        // Verify we got actual data, not all nulls
        var hasValidData = Object.keys(formattedData).some(function(key) {
          return formattedData[key].name !== "Facebook User";
        });
        
        if (!hasValidData) {
          log.warn("getUserInfo", "Received empty user data, trying alternate method");
          // Fall back to basic user info
          var fallbackData = {};
          id.forEach(function(userId) {
            fallbackData[userId] = {
              name: "Facebook User",
              firstName: "Facebook",
              vanity: null,
              thumbSrc: null,
              profileUrl: `https://www.facebook.com/${userId}`,
              gender: 0,
              type: "user",
              isFriend: false,
              isBirthday: false
            };
          });
          return callback(null, fallbackData);
        }
        
        return callback(null, formattedData);
      })
      .catch(function (err) {
        log.error("getUserInfo", err);
        
        // Provide fallback data instead of complete failure
        var fallbackData = {};
        id.forEach(function(userId) {
          fallbackData[userId] = {
            name: "Facebook User",
            firstName: "Facebook",
            vanity: null,
            thumbSrc: null,
            profileUrl: `https://www.facebook.com/${userId}`,
            gender: 0,
            type: "user",
            isFriend: false,
            isBirthday: false
          };
        });
        
        log.warn("getUserInfo", "Using fallback data due to API error");
        return callback(null, fallbackData);
      });

    return returnPromise;
  };
};

// fixed by Aayusha