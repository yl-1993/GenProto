function isBool(value) {
  if (value == "true" || value == "false") {
    return true;
  }
  return false;
}

function get_data_str(_data, field) {
  var res = "";
  if (field === "phase") {
    res = '\t' + 'include { ' + field + ": " + _data[field] + ' }\n';
  } else if (field === "category") {
    res = '\t' + "type" + ": " + _data[field] + '\n';
  } else if (field === "top" || field === "bottom") {
    //console.log(_data[field]);
    for (var i = 0; i < _data[field].length; ++i) {
      res += '\t' + field + ": \"" + _data[field][i] + '\"\n';
    }
  } else {
    if (isNaN(_data[field]) && !isBool(_data[field])) {
      res = '\t' + field + ": \"" + _data[field] + '\"\n';
    } else {
      res = '\t' + field + ": " + _data[field] + '\n';
    }
  }
  //console.log(res);
  return res;
}

function get_param_name(_raw_param) {
  var _param = _raw_param[0];
  //console.log(_param);
  for (var _key_param in _param) {
    return _key_param;
  }
  return "";
}

function get_filler_str(obj, key, type) {
  var pre = "\t\t\t";
  var res = pre + "type: \"" + type + "\"\n";
  if (type == "constant") {
    if (!obj[key + "_value"]) {
      if (key == "scale_filler") {
        obj[key + "_value"] = 1;
      } else {
        obj[key + "_value"] = 0;
      }
    }
    res += pre + "value: " + obj[key + "_value"] + "\n";
  } else if (type == "uniform") {
    if (!obj[key + "_min"]) {
      obj[key + "_min"] = 0;
    }
    if (!obj[key + "_max"]) {
      obj[key + "_max"] = 1;
    }
    res += pre + "min: " + obj[key + "_min"] + "\n";
    res += pre + "max: " + obj[key + "_max"] + "\n";
  } else if (type == "gaussian") {
    if (!obj[key + "_mean"]) {
      obj[key + "_mean"] = 0;
    }
    if (!obj[key + "_std"]) {
      obj[key + "_std"] = 1;
    }
    res += pre + "mean: " + obj[key + "_mean"] + "\n";
    res += pre + "std: " + obj[key + "_std"] + "\n";
  }
  return res;
}

// Show the diagram's model in JSON format that the user may edit
function save_prototxt(_model) {
  var prototxt = "name: \"net\"\n";
  var _node_data_array = _model[0]['nodeDataArray'];
  var _link_data_array = _model[0]['linkDataArray'];
  var _node_data_num = _node_data_array.length;
  var _link_data_num = _link_data_array.length;
  var _map = {};
  // parse layers
  for (var i = 0; i < _node_data_num; ++i) {
    var _data = _node_data_array[i];
    var _layer = {};
    if (_map[_data["name"]] && _map[_data["name"]]["phase"] == _data["phase"]) {
      if (_data["phase"]) {
        alert("ERROR: The " + _data["name"] + " layer" + " in " + _data["phase"] +
          " phase has already existed.");
      } else {
        alert("ERROR: The " + _data["name"] + " layer" +
          " in TRAIN and TEST phase has already existed.");
      }
    }
    _layer["name"] = _data["name"];
    _layer["category"] = _data["category"];
    if (_data.category != 'BLOB') {
      var param_list = get_param_list(_layers[_data.category]);
      if (param_list) {
        var param_num = param_list.length;
        for (var j = 0; j < param_num; ++j) {
          if (_data[param_list[j]]) {
            _layer[param_list[j]] = _data[param_list[j]];
          }
        }
      }
      if (_data["phase"]) {
        _layer["phase"] = _data["phase"];
      }
    }
    _map[_data["key"]] = _layer;
  }

  console.log(_map);

  // parse edges
  for (var i = 0; i < _link_data_num; ++i) {
    var _edge = _link_data_array[i];
    var from_obj = _map[_edge["from"]];
    var to_obj = _map[_edge["to"]];
    if (from_obj.category != "BLOB" && to_obj.category == "BLOB") { // from layer to blob
      if (!from_obj["top"]) {
        _map[_edge["from"]]["top"] = [];
      }
      _map[_edge["from"]]["top"].push(to_obj["name"]);
    } else if (from_obj.category == "BLOB" && to_obj.category != "BLOB") { // from blob to layer
      if (!to_obj["bottom"]) {
        _map[_edge["to"]]["bottom"] = [];
      }
      _map[_edge["to"]]["bottom"].push(from_obj["name"]);
    } else if (from_obj.category != "BLOB" && to_obj.category != "BLOB") {
      console.log("Not allowed both layers!");
      alert("Layers are not allowed to connect to layers directly!");
      return;
    } else if (from_obj.category == "BLOB" && to_obj.category == "BLOB") {
      console.log("Not allowed both blob!");
      alert("Blobs are not allowed to connect to Blobs directly!");
      return;
    }
  }

  //console.log(_map);

  for (var index in _map) {
    var obj = _map[index];
    if (obj.category != "BLOB") {
      var _layer_str = "layer {\n";

      _layer_str += get_data_str(obj, "name");
      _layer_str += get_data_str(obj, "category");
      if (obj["top"]) {
        _layer_str += get_data_str(obj, "top");
      }
      if (obj["bottom"]) {
        _layer_str += get_data_str(obj, "bottom");
      }

      var flag = 0;
      for (var key in obj) {
        //console.log(key);
        if (key != "name" && key != "top" && key != "bottom" && key != "phase" &&
          key != "category") {
          if (!flag) {
            _layer_str += "\t" + get_param_name(_layers[obj.category]) + "{\n";
            flag = 1;
          }
          if (key == "weight_filler") {
            _layer_str += "\t\t" + key + " {\n";
            if (!obj[key + "_type"]) {
              _layer_str += "\t\t\t" + "type: \"xavier\"" + "\n";
            } else {
              _layer_str += get_filler_str(obj, key, obj[key + "_type"]);
            }
            _layer_str += "\t\t}\n"
          } else if (key == "bias_filler" || key == "scale_filler" || key ==
            "shift_filler" || key == "data_filler") {
            _layer_str += "\t\t" + key + " {\n";
            if (!obj[key + "_type"]) {
              _layer_str += "\t\t\t" + "type: \"constant\"" + "\n";
              if (key == "scale_filler") {
                _layer_str += "\t\t\t" + "value: 1" + "\n";
              } else {
                _layer_str += "\t\t\t" + "value: 0" + "\n";
              }
            } else {
              _layer_str += get_filler_str(obj, key, obj[key + "_type"]);
            }
            _layer_str += "\t\t}\n";
          } else if (key.search("filler") >= 0) {
            continue;
          } else {
            _layer_str += '\t' + get_data_str(obj, key);
          }
        }
      }
      if (flag) {
        _layer_str += "\t" + "}\n"
      }
      if (obj["phase"]) {
        _layer_str += get_data_str(obj, "phase");
      }
      _layer_str += "}\n";

      prototxt += _layer_str;
    }
  }

  return prototxt;
}
