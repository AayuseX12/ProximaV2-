"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  return function changeGroupName(newName, threadID, callback) {
    if (!newName || typeof newName !== "string") {
      throw new Error("Please provide a valid new group name as the first argument.");
    }

    if (!threadID || typeof threadID !== "string") {
      throw new Error("Please provide a valid threadID as the second argument.");
    }

    // Return a Promise if no callback is provided
    var resolveFunc = function () {};
    var rejectFunc = function () {};
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err) {
        if (err) return rejectFunc(err);
        resolveFunc();
      };
    }

    // Prepare the form data
    var form = {
      thread_name: newName,
      thread_fbid: threadID,
    };

    // Make the request to update the group name
    defaultFuncs
      .post("https://www.facebook.com/messaging/set_thread_name/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (resData.error) {
          log.error("changeGroupName", resData.error);
          return callback(resData.error);
        }

        log.info("changeGroupName", "Group name updated successfully.");
        return callback();
      })
      .catch(function (err) {
        log.error("changeGroupName", err);
        return callback(err);
      });

    return returnPromise;
  };
};