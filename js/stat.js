function get_loc(start_x, start_y) {
  return (start_x + " " + start_y);
}

function compute_attr_info(_node_data_array, _link_data_array) {
  //document.getElementById("model_size").innerHTML = compute_model_size(_node_data_array, _link_data_array);
  //document.getElementById("data_memory").innerHTML = compute_data_memory(_node_data_array, _link_data_array);
}

function compute_model_size(_node_data_array, _link_data_array) {
  var _node_data_num = _node_data_array.length;
  var _link_data_num = _link_data_array.length;
  var _map = {};
  var _struct_list = [];
  // parse layers
  for (var i = 0; i < _node_data_num; ++i) {
    var _data = _node_data_array[i];
    var _layer = {};

    _layer["key"] = _data["key"];
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
  // parse over

  _edge_to = {};

  for (var i = 0; i < _link_data_num; ++i) {
    if (!_edge_to[_link_data_array[i]["to"]]) {
      _edge_to[_link_data_array[i]["to"]] = [];
    }
    _link_data_array[i]["points"] = [];
    _link_data_array[i]["fromPort"] = "T";
    _link_data_array[i]["toPort"] = "B";
    _edge_to[_link_data_array[i]["to"]].push(_edge_to[_link_data_array[i][
      "from"
    ]]);
  }
  // select bottom
  var bottom_list = [];
  for (var _key in _map) {
    if (!_edge_to[_key]) {
      bottom_list.push(_map[_key]);
    }
  }

  var cur_bottom = bottom_list;

  for (var i = 0; i < cur_bottom.length; ++i) {
    if (cur_bottom[i].width && cur_bottom[i].height) {
      cur_bottom[i]._map_wsize = cur_bottom[i].width;
      cur_bottom[i]._map_hsize = cur_bottom[i].height;
    }
  }

  console.log(cur_bottom);

  var model_size = 0;
  var calculation = 0;

  while (cur_bottom.length) {
    var layer_cur_top = [];
    for (var j = 0; j < cur_bottom.length; ++j) {
      var cur_top = [];
      for (var i = 0; i < _link_data_num; ++i) {
        if (_link_data_array[i]["from"] == cur_bottom[j].key) {
          cur_top.push(_map[_link_data_array[i]["to"]]);
        }
      }
      console.log(cur_bottom[j]);
      for (var i = 0; i < cur_top.length; ++i) {
        if (cur_top[i].category == "CONVOLUTION" || cur_top[i].category ==
          "INNER_PRODUCT") {
          if (cur_bottom[j].kernel_h && cur_bottom[j].kernel_w && cur_bottom[j]
            .stride && cur_bottom[j].num_output && cur_top[i].num_output) {
            var tmp_num = (cur_bottom[j].kernel_h * cur_bottom[j].kernel_w *
              cur_bottom[j].num_output * cur_top[i].num_output) / (cur_bottom[
              j].stride * cur_bottom[j].stride);
            model_size += tmp_num;
            calculation += tmp_num * cur_bottom[j]._map_wsize * cur_bottom[j]._map_hsize;
          } else if (cur_bottom[j].kernel_size && cur_bottom[j].stride &&
            cur_bottom[j].num_output && cur_top[i].num_output) {
            var tmp_num = (cur_bottom[j].kernel_size * cur_bottom[j].kernel_size *
              cur_bottom[j].num_output * cur_top[i].num_output) / (cur_bottom[
              j].stride * cur_bottom[j].stride);
            model_size += tmp_num;
            calculation += tmp_num * cur_bottom[j]._map_wsize * cur_bottom[j]._map_hsize;
          }
        } else {
          cur_top[i]._map_wsize = cur_bottom[j]._map_wsize;
          cur_top[i]._map_hsize = cur_bottom[j]._map_hsize;
        }
        layer_cur_top.push(cur_top[i]);
        for (var k = 0; k < _node_data_num; ++k) {
          if (_node_data_array[k].key == cur_top[i].key) {
            _node_data_array[k]._map_wsize = cur_top[i]._map_wsize;
            _node_data_array[k]._map_hsize = cur_top[i]._map_hsize;
            break;
          }
        }
      }
    }
    // update current bottom
    //layer_cur_top = unique(layer_cur_top);
    cur_bottom = layer_cur_top;
    //console.log(cur_bottom);
  }
  console.log(calculation);
  return model_size;
}

function compute_data_memory(_node_data_array, _link_data_array) {
  return 0;
}

function gen_map_size_from_struct(_node_data_array, _link_data_array) {
  var _node_data_num = _node_data_array.length;
  var _link_data_num = _link_data_array.length;
  var _map = {};
  var _struct_list = [];
  // parse layers
  for (var i = 0; i < _node_data_num; ++i) {
    var _data = _node_data_array[i];
    var _layer = {};

    _layer["key"] = _data["key"];
    _layer["name"] = _data["name"]
    _layer["category"] = _data["category"]
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
  // parse over

  _edge_to = {};

  for (var i = 0; i < _link_data_num; ++i) {
    if (!_edge_to[_link_data_array[i]["to"]]) {
      _edge_to[_link_data_array[i]["to"]] = [];
    }
    _link_data_array[i]["points"] = [];
    _link_data_array[i]["fromPort"] = "T";
    _link_data_array[i]["toPort"] = "B";
    _edge_to[_link_data_array[i]["to"]].push(_edge_to[_link_data_array[i][
      "from"
    ]]);
  }
  // select bottom
  var bottom_list = [];
  for (var _key in _map) {
    if (!_edge_to[_key]) {
      bottom_list.push(_map[_key]);
    }
  }

  var cur_bottom = bottom_list;

  for (var i = 0; i < cur_bottom.length; ++i) {
    if (cur_bottom[i].width && cur_bottom[i].height) {
      cur_bottom[i]._map_wsize = cur_bottom[i].width;
      cur_bottom[i]._map_hsize = cur_bottom[i].height;
    }
  }

  console.log(cur_bottom);

  var model_size = 0;
  var calculation = 0;

  while (cur_bottom.length) {
    var layer_cur_top = [];
    for (var j = 0; j < cur_bottom.length; ++j) {
      var cur_top = [];
      for (var i = 0; i < _link_data_num; ++i) {
        if (_link_data_array[i]["from"] == cur_bottom[j].key) {
          cur_top.push(_map[_link_data_array[i]["to"]]);
        }
      }
      for (var i = 0; i < cur_top.length; ++i) {
        if (cur_top[i].category == "CONVOLUTION" || cur_top[i].category ==
          "POOLING") {
          if (cur_top[i].kernel_h && cur_top[i].kernel_w && cur_top[i].stride) {
            cur_top[i]._map_wsize = (cur_bottom[j]._map_wsize - cur_top[i].kernel_w) /
              cur_top[i].stride + 1;
            cur_top[i]._map_hsize = (cur_bottom[j]._map_hsize - cur_top[i].kernel_h) /
              cur_top[i].stride + 1;
          } else if (cur_top[i].kernel_size && cur_top[i].stride) {
            cur_top[i]._map_wsize = (cur_bottom[j]._map_wsize - cur_top[i].kernel_size) /
              cur_top[i].stride + 1;
            cur_top[i]._map_hsize = (cur_bottom[j]._map_hsize - cur_top[i].kernel_size) /
              cur_top[i].stride + 1;
          }
        } else {
          cur_top[i]._map_wsize = cur_bottom[j]._map_wsize;
          cur_top[i]._map_hsize = cur_bottom[j]._map_hsize;
        }
        layer_cur_top.push(cur_top[i]);
        for (var k = 0; k < _node_data_num; ++k) {
          if (_node_data_array[k].key == cur_top[i].key) {
            _node_data_array[k]._map_wsize = cur_top[i]._map_wsize;
            _node_data_array[k]._map_hsize = cur_top[i]._map_hsize;
            break;
          }
        }

        if (cur_bottom[j].category == "CONVOLUTION" && (cur_top[i].category ==
            "CONVOLUTION" || cur_top[i].category == "INNER_PRODUCT")) {
          if (cur_bottom[j].kernel_h && cur_bottom[j].kernel_w && cur_bottom[j]
            .stride && cur_bottom[j].num_output && cur_top[i].num_output) {
            var tmp_num = (cur_bottom[j].kernel_h * cur_bottom[j].kernel_w *
              cur_bottom[j].num_output * cur_top[i].num_output) / (cur_bottom[
              j].stride * cur_bottom[j].stride);
            model_size += tmp_num;
            calculation += tmp_num * cur_bottom[j]._map_wsize * cur_bottom[j]._map_hsize;
          } else if (cur_bottom[j].kernel_size && cur_bottom[j].stride &&
            cur_bottom[j].num_output && cur_top[i].num_output) {
            var tmp_num = (cur_bottom[j].kernel_size * cur_bottom[j].kernel_size *
              cur_bottom[j].num_output * cur_top[i].num_output) / (cur_bottom[
              j].stride * cur_bottom[j].stride);
            model_size += tmp_num;
            calculation += tmp_num * cur_bottom[j]._map_wsize * cur_bottom[j]._map_hsize;
          }
        }
      }
    }
    // update current bottom
    //layer_cur_top = unique(layer_cur_top);
    cur_bottom = layer_cur_top;
    //console.log(cur_bottom);
  }
  document.getElementById("model_size").innerHTML = model_size;
  document.getElementById("data_memory").innerHTML = 0;
  document.getElementById("calculation").innerHTML = calculation;
}
