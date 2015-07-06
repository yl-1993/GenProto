function unique(arr) {
  'use strict';
  var result = [],
    hash = {};
  for (var i = 0, elem;
    (elem = arr[i]) != null; i++) {
    if (!hash[elem]) {
      result.push(elem);
      hash[elem] = true;
    }
  }
  return result;
}

function filter_top_layers(arr, top_list) {
  'use strict';
  var res = [];
  var hash = {};
  var i;
  for (i = 0; i < top_list.length; i += 1) {
    hash[top_list[i]] = 1;
  }
  for (i = 0; i < arr.length; i += 1) {
    if (!hash[arr[i]]) { // not in top_list
      res.push(arr[i]);
    }
  }
  return res;
}

function gen_loc_from_layers(_node_data_array, _link_data_array, _model) {
  'use strict';
  // modified nodeDataArray loc
  var _node_data_num = _node_data_array.length;
  var _link_data_num = _link_data_array.length;
  var _map = {};
  var start_x = -45;
  var start_y = 325;
  var delta_x = 200;
  var delta_y = -100;
  var _struct_list = [];
  var i, j, k;
  // parse layers
  for (i = 0; i < _node_data_num; ++i) {
    var _data = _node_data_array[i];
    var _layer = {};

    _layer["name"] = _data["name"]
    _layer["category"] = _data["category"]
    if (_data.category != 'BLOB') {
      var param_list = get_param_list(_layers[_data.category]);
      if (param_list) {
        var param_num = param_list.length;
        for (j = 0; j < param_num; ++j) {
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

  //console.log(_map);
  //console.log(_link_data_array);

  var _edge_to = {};
  var _edge_from = {};

  for (i = 0; i < _link_data_num; ++i) {
    if (!_edge_to[_link_data_array[i]["to"]]) {
      _edge_to[_link_data_array[i]["to"]] = [];
    }
    if (!_edge_from[_link_data_array[i]["from"]]) {
      _edge_from[_link_data_array[i]["from"]] = [];
    }
    _link_data_array[i]["points"] = [];
    _link_data_array[i]["fromPort"] = "T";
    _link_data_array[i]["toPort"] = "B";
    _edge_to[_link_data_array[i]["to"]].push(_link_data_array[i]["from"]);
    _edge_from[_link_data_array[i]["from"]].push(_link_data_array[i]["to"]);
  }

  // console.log(_edge_to);
  // console.log(_edge_from);

  // select bottom and top
  var bottom_list = [];
  var top_list = [];
  for (var _key in _map) {
    if (!_edge_to[_key]) {
      bottom_list.push(_key);
    }
    if (!_edge_from[_key]) {
      top_list.push(_key);
    }
  }

  //console.log(bottom_list);
  //console.log(top_list);

  // 
  // for (i = 0; i < _link_data_num; ++i) {
  //   for (j = 0; j < bottom_list.length; ++j) {
  //     for (k = 0; k < top_list.length; ++k) {
  //       if(_link_data_array[i]["from"] == bottom_list[j] && 
  //          _link_data_array[i]["to"] == top_list[k] &&
  //          _edge_from[bottom_list[j]] == top_list[j])
  //     }
  //   }
  // }

  // Calculate the exact position of each node
  var cur_bottom = bottom_list;
  var cur_start_x = start_x - (cur_bottom.length - 1.0) / 2 * delta_x;
  for (i = 0; i < cur_bottom.length; ++i) {
    for (j = 0; j < _node_data_num; ++j) {
      if (_node_data_array[j]["key"] == cur_bottom[i]) {
        _node_data_array[j]["loc"] = get_loc(start_x + i * delta_x, start_y);
        break;
      }
    }
  }

  var depth = 1;
  var visited_list = {};
  var cur_top, cur_top_num;
  while (cur_bottom.length > 0) {
    cur_top = [];
    for (i = 0; i < _link_data_num; ++i) {
      for (j = 0; j < cur_bottom.length; ++j) {
        if (visited_list[cur_bottom[j]]) {
          continue;
        }
        if (_link_data_array[i]["from"] == cur_bottom[j]) {
          cur_top.push(_link_data_array[i]["to"]);
        }
      }
    }
    for (i = 0; i < cur_bottom.length; ++i) {
      if (!visited_list[cur_bottom[i]]) {
        visited_list[cur_bottom[i]] = 1;
      }
    }
    var hit_num = 0;
    var j_list = {};
    var tmp_cur_top = [];
    for (i = 0; i < top_list.length; ++i) {
      for (j = 0; j < cur_top.length; ++j) {
        if (cur_top[j] == top_list[i]) {
          j_list[j] = 1;
          hit_num++;
          break;
        }
      }
    }
    for (i = 0; i < cur_top.length; ++i) {
      if (!j_list[i]) {
        tmp_cur_top.push(cur_top[i]);
      }
    }
    if (tmp_cur_top.length > 0) {
      cur_top = tmp_cur_top;
    }
    cur_top = unique(cur_top);
    cur_top = filter_top_layers(cur_top, top_list);

    cur_top_num = cur_top.length;

    cur_start_x = start_x - (cur_top_num - 1.0) / 2 * delta_x;
    for (j = 0; j < cur_top_num; ++j) {
      for (k = 0; k < _node_data_num; ++k) {
        if (_node_data_array[k]["key"] == cur_top[j]) {
          // console.log(cur_top[j] + ":" + (cur_start_x + j * delta_x));
          _node_data_array[k]["loc"] = get_loc(cur_start_x + j * delta_x,
            start_y + depth * delta_y);
          break;
        }
      }
    }

    cur_bottom = cur_top;
    depth += 1;
    if (depth > 200) {
      alert("Warning: Network is too complicated!");
      break;
    }
  }

  // cal the exact position for top blob, from left to right
  cur_top = top_list;
  cur_top_num = cur_top.length;
  cur_start_x = start_x - (cur_top_num - 1.0) / 2 * delta_x;
  for (j = 0; j < cur_top_num; ++j) {
    for (k = 0; k < _node_data_num; ++k) {
      if (_node_data_array[k]["key"] == cur_top[j]) {
        _node_data_array[k]["loc"] = get_loc(cur_start_x + j * delta_x,
          start_y + depth * delta_y);
        break;
      }
    }
  }

  console.log(_edge_from);
  console.log(bottom_list);
  console.log(top_list);
  for (i = 0; i < _link_data_num; ++i) {
    for (j = 0; j < bottom_list.length; ++j) {
      for (k = 0; k < top_list.length; ++k) {
        if (k > 0 && k < top_list.length - 1){
          continue;
        }
        if (_link_data_array[i]["from"] == bottom_list[j] && 
           _link_data_array[i]["to"] == top_list[k] &&
           _edge_from[bottom_list[j]].contains(top_list[k])) {
          if (k == 0) {
            _link_data_array[i]["fromPort"] = "L";
            _link_data_array[i]["toPort"] = "L"; 
            console.log(_link_data_array[i]);
          } else if (k == top_list.length - 1) {
            _link_data_array[i]["fromPort"] = "R";
            _link_data_array[i]["toPort"] = "R"; 
          }         
        }
      }
    }
  }

  _model["nodeDataArray"] = _node_data_array;
  _model["linkDataArray"] = _link_data_array;
  return _model.toJson();
}
