var prettifyJSONString = function(str) {
  'use strict';
  var obj = JSON.parse(str);
  return JSON.stringify(obj, null, 2);
};
