var spaces = function(num) {
  'use strict';
  var res = "";
  var i;
  for (i = 0; i < num; i += 1) {
    res += "  ";
  }
  return res;
};

var json2prototxt_layer = function(obj) {
  'use strict';
  return "layer " + json_obj2prototxt(obj, 0);
};

var json_obj2prototxt = function(obj, indent) {
  'use strict';
  var res = "{\n";
  var key;
  var i, j, k;
  for (key in obj) {
    if (obj[key] instanceof Object && !(obj[key] instanceof Array)) {
      res += spaces(indent + 1) + key + " " + json_obj2prototxt(obj[key],
        indent +
        1);
    } else if (obj[key] instanceof Array) {

      for (i = 0; i < obj[key].length; i += 1) {
        if (obj[key][i] instanceof Object) {
          res += spaces(indent + 1) + key + " " + json_obj2prototxt(obj[key][i], indent + 1);
        } else {
          res += spaces(indent + 1) + key + " : " + add_quote(obj[key][i]) + "\n";
        }
      }
    } else {
      res += spaces(indent + 1) + key + " : " + add_quote(obj[key]) + "\n";
    }
  }
  res += spaces(indent) + "}\n";
  return res;
};

var add_quote = function(z) {
  'use strict';
  if (isNaN(parseFloat(z))) {
    if (z == "TRAIN" || z == "TEST" || z == "LMDB" || z == "MAX" || z === true || z === false) {
      return z;
    } else {
      return "\"" + z + "\"";
    }
  } else {
    return z;
  }
};

// Show the diagram's model in JSON format that the user may edit
function save_prototxt(_model) {
  'use strict';
  var prototxt = "name: \"net\"\n";
  var _node_data_array = _model[0]['nodeDataArray'];
  var _link_data_array = _model[0]['linkDataArray'];
  var jsons = [];
  var i,j,k;
  for(i = 0; i < _node_data_array.length; i += 1){
    var json = _node_data_array[i].json;
    prototxt += json2prototxt_layer(json);
  }

  //look for relu layer (hidden)
  for(i = 0; i < _link_data_array.length; i += 1){
    if(_link_data_array[i].text == "ReLU"){
      prototxt += json2prototxt_layer(_link_data_array[i].relu_data);
    }
  }
  return prototxt;
}
