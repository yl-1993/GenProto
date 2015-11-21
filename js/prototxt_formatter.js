var spaces = function(num) {
  'use strict';
  var res = "";
  var i;
  for (i = 0; i < num; i += 1) {
    res += "  ";
  }
  return res;
};

// tips: whether reserve empty content for tips or not
var json2prototxt_layer = function(obj, tips) {
  'use strict';
  if (tips == undefined) {
      tips = true;
  }
  return "layer " + json_obj2prototxt(obj, 0, tips);
};

var json_obj2prototxt = function(obj, indent, tips) {
  'use strict';
  var res = "{\n";
  var key;
  var i, j, k;
  for (key in obj) {
    if (obj[key] instanceof Object && !(obj[key] instanceof Array)) {
      res += spaces(indent + 1) + key + " " + json_obj2prototxt(obj[key], indent + 1, tips);
    } else if (obj[key] instanceof Array) {

      for (i = 0; i < obj[key].length; i += 1) {
        if (obj[key][i] instanceof Object) {
          res += spaces(indent + 1) + key + " " + json_obj2prototxt(obj[key][i], indent + 1, tips);
        } else {
          if (obj[key] != "" || tips) {
            res += spaces(indent + 1) + key + " : " + add_quote(obj[key][i]) + "\n";
          }
        }
      }
    } else {
        if (obj[key] !== "" || tips) {
          res += spaces(indent + 1) + key + " : " + add_quote(obj[key]) + "\n";
        } else {
          console.log(key)
          console.log(obj[key])
          console.log(tips)
        }
    }
  }
  res += spaces(indent) + "}\n";
  return res;
};

var add_quote = function(z) {
  'use strict';
  if (isNaN(parseFloat(z))) {
    if (z == "TRAIN" || z == "TEST" || z == "LMDB" || z == "LEVEL_DB" || 
      z == "MAX" || z == "AVE" || z =="FAN_OUT" || z == "FAN_IN" ||
      z === true || z === false) {
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
  var json, _layer_name = '';
  var i,j,k;

  //translate json to prototxt
  for(i = 0; i < _node_data_array.length; i += 1){
    json = _node_data_array[i].json;
    prototxt += json2prototxt_layer(json, false);
    for(j = 0; j < _link_data_array.length; j += 1){
      if(_link_data_array[j].from == _node_data_array[i].name 
        && _link_data_array[j].text == "ReLU"){
        prototxt += json2prototxt_layer(_link_data_array[j].relu_data, false);
        break;
      }
      if(_link_data_array[j].from == _node_data_array[i].name 
        && _link_data_array[j].text == "Dropout"){
        prototxt += json2prototxt_layer(_link_data_array[j].dropout_data, false);
        break;
      }
      if(_link_data_array[j].from == _node_data_array[i].name 
        && _link_data_array[j].text == "ReLU&Dropout"){
        prototxt += json2prototxt_layer(_link_data_array[j].relu_data, false);
        prototxt += json2prototxt_layer(_link_data_array[j].dropout_data, false);
        break;
      }
    }
  }
  //look for relu layer (hidden)
  // for(i = 0; i < _link_data_array.length; i += 1){
  //   if(_link_data_array[i].text == "ReLU"){
  //     prototxt += json2prototxt_layer(_link_data_array[i].relu_data, false);
  //   }
  //   if(_link_data_array[i].text == "Dropout"){
  //     prototxt += json2prototxt_layer(_link_data_array[i].dropout_data, false);
  //   }
  // }
  return prototxt;
}
