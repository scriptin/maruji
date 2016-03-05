var actionTypes = require('./actionTypes');

function initApp() {
  return {
    type: actionTypes.INIT_APP
  };
}

module.exports = {
  initApp: initApp
};
