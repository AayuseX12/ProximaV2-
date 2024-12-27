"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  return function changeGroupName(newName, threadID, callback) {
    // Validate inputs
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

    // Set the callback function if not provided
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

    // Make the API request to update the group name
    defaultFuncs
      .post("https://www.facebook.com/messaging/set_thread_name/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs)) // Check login status
      .then(function (resData) {
        // Check if the response contains an error
        if (resData.error) {
          log.error("changeGroupName", `Error from API: ${resData.error}`);
          return callback(resData.error);
        }

        // Successful response
        log.info("changeGroupName", `Group name updated successfully to "${newName}".`);
        return callback();
      })
      .catch(function (err) {
        // Log error details for debugging
        log.error("changeGroupName", `Error during API request: ${err.message}`);
        
        // Handle specific error types
        if (err.response) {
          log.error("changeGroupName", `Response Error: ${err.response}`);
        }

        return callback(err);
      });

    return returnPromise;
  };
};