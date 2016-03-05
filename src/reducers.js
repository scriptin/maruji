var initialState = {};

function app(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }
  return state;
}

module.exports = app;
