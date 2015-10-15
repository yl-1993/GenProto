function get_loc(start_x, start_y) {
  return (start_x + " " + start_y);
}

function compute_attr_info(_node_data_array, _link_data_array) {
  //document.getElementById("model_size").innerHTML = compute_model_size(_node_data_array, _link_data_array);
  //document.getElementById("data_memory").innerHTML = compute_data_memory(_node_data_array, _link_data_array);
  var _node_data_num = _node_data_array.length;
  var _link_data_num = _link_data_array.length;
  var _map = {};

  var _edge_to = {};
  var _edge_from = {};
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

  var model_size = compute_model_size(bottom_list, top_list, _edge_to, _edge_from, _node_data_array, _link_data_array);
  document.getElementById('model_size').innerHTML = model_size*4;
  document.getElementById('model_size_mb').innerHTML = model_size*4/1024/1024;
}

function search_obj_for_whc(json) {
  var wflag = true, hflag = true, cflag = true;
  var w, h ,c;
  for (var obj in json) {
    if (typeof(json[obj]) == "object") {
      var param = json[obj];
      for (var key_obj in param){
        if (param[key_obj]) {
          if(key_obj == "width") {
            w = param[key_obj];
            wflag = false;
          } else if (key_obj == "height") {
            h = param[key_obj];
            hflag = false;
          } else if (key_obj == "channels") {
            c = param[key_obj];
            cflag = false;
          } else if (key_obj == "channel") {
            c = param[key_obj];
            cflag = false;
          }
        }
      }
    }
  }
  if(wflag || !w) {
    w = 256;
  }
  if(hflag || !h) {
    h = 256;
  }
  if(cflag || !c) {
    c = 3;
  }
  return {
    "w":w,
    "h":h,
    "c":c,
    "wflag":wflag,
    "hflag":hflag,
    "cflag":cflag
  };  
}

function check_whc(bottom_list, _node_data_array) {
  var i, j;
  var w, h ,c;
  var wflag, hflag, cflag;
  var bottom_num = bottom_list.length;
  var _node_data_num = _node_data_array.length;
  var res;
  var msg = "";

  // check the input width, height and channel. This setting has higher priority.
  if (document.getElementById("input_width").value && 
      document.getElementById("input_height").value &&
      document.getElementById("input_channel").value) {
    return {
      "w":document.getElementById("input_width").value,
      "h":document.getElementById("input_height").value,
      "c":document.getElementById("input_channel").value
    };      
  }

  // if the input box is empty
  for (i = 0; i < bottom_num; ++i) {
    for (j = 0; j < _node_data_num; ++j) {
      if(_node_data_array[j].key == bottom_list[i]) {
        // search for w, h ,c
        res = search_obj_for_whc(_node_data_array[j].json);
      }
    }
  }
  document.getElementById("input_width").value = res.w;
  document.getElementById("input_height").value = res.h;
  document.getElementById("input_channel").value = res.c;
  if(res.wflag) {
    msg += "width ";
  }
  if(res.hflag) {
    msg += "height ";
  }
  if(res.cflag) {
    msg += "channel";
  }
  if (msg != "") {
    showErrorToast("The default setting is 256x256x3. Please fill in:" + msg);
  }
  return res;
}

function compute_model_size(bottom_list, top_list, _edge_to, _edge_from, _node_data_array, _link_data_array) {
  var res = check_whc(bottom_list, _node_data_array);
  var cur_bottom = bottom_list;
  var cur_bottom_nodes = [];
  var cur_top;
  var cur_top_nodes;
  var i, j;
  var w, h;
  var model_size = 0;
  for (i = 0; i < cur_bottom.length; ++i) {
    var node = myDiagram.model.findNodeDataForKey(cur_bottom[i]);
    if (node) {
      node.stat = {}
      node.stat.w = res.w;
      node.stat.h = res.h;
      node.stat.c = res.c;
      cur_bottom_nodes.push(node);
    } else {
      showErrorToast("Cannot find node: " + cur_bottom[i]);
      return 0;
    }
  }
  while(cur_bottom.length > 0) {
    cur_top = [];
    cur_top_nodes = [];
    // check the image size from different bottoms
    var w_array = [], h_array = [], c_array = [];
    var str_name = "";
    for (i = 0; i < cur_bottom.length; ++i) {
      w_array.push(cur_bottom_nodes[i].stat.w);
      h_array.push(cur_bottom_nodes[i].stat.h);
      c_array.push(cur_bottom_nodes[i].stat.c);
      str_name += cur_bottom_nodes[i].name + " ";
    }
    w_array = w_array.unique();
    h_array = h_array.unique();
    if (w_array.length != 1 || h_array.length != 1) {
      showErrorToast("The image size is not the same! Please check: " + str_name);
      //return 0;
    } 
    // else {
    //   w = w_array[0];
    //   h = h_array[0];
    // }
    w = w_array[0];
    h = h_array[0];
    // get current top
    for (i = 0; i < cur_bottom.length; ++i) {
      var top_keys = _edge_from[cur_bottom[i]];
      if (top_keys) {
        for (j = 0; j < top_keys.length; ++j) {
            cur_top.push(top_keys[j]);
        }
      }
    }
    cur_top = cur_top.unique();
    // handle current top node
    for (i = 0; i < cur_top.length; ++i) {
      var top_node = myDiagram.model.findNodeDataForKey(cur_top[i]);
      top_node.stat = {};
      if (top_node.type == "Concat") {
        top_node.stat.w = w;
        top_node.stat.h = h;
        top_node.stat.c = 0;
        for (k = 0; k < c_array.length; ++k) {
          top_node.stat.c += c_array[k]; 
        }
        top_node.stat.model_size = 0;
      } else {
        c_array = c_array.unique();
        if (c_array.length != 1) {
          showErrorToast("Channels from bottom nodes are different! Please check: "+str_name);
          //return 0;
        }
        c = c_array[0];
        //console.log(c)
        w = parseInt(w);
        h = parseInt(h);
        c = parseInt(c);
        if (top_node.type == "Convolution" || top_node.type == "ConvolutionData") {
          var num_output = parseInt(top_node.json.convolution_param.num_output);
          var kernel_size = parseInt(top_node.json.convolution_param.kernel_size);
          var stride = parseInt(top_node.json.convolution_param.stride || 1);
          var pad = parseInt(top_node.json.convolution_param.pad || 0);
          if (num_output && kernel_size && stride) {
            top_node.stat.w = (w + 2*pad - kernel_size + 1) / stride;
            top_node.stat.h = (h + 2*pad - kernel_size + 1) / stride;
            top_node.stat.c = num_output;
            top_node.stat.model_size = c*(kernel_size*kernel_size)*num_output;
          } else {
            showErrorToast("Some parameters are lost! Please check layer: " + top_node.name);
            return 0;
          }
        } else if (top_node.type == "InnerProduct" || top_node.type == "InnerProductAll") {
          var num_output = parseInt(top_node.json.inner_product_param.num_output);
          if (num_output) {
            top_node.stat.w = w;
            top_node.stat.h = h;
            top_node.stat.c = num_output;
            top_node.stat.model_size = (w*h*c)*num_output;
          } else {
            showErrorToast("Some parameters are lost! Please check layer: " + top_node.name);
            return 0;
          }
        } else if (top_node.type == "Pooling") {
          var kernel_size = parseInt(top_node.json.pooling_param.kernel_size);
          var stride = parseInt(top_node.json.pooling_param.stride || 1);
          var pad = parseInt(top_node.json.pooling_param.pad || 0);
          if (kernel_size && stride) {
            top_node.stat.w = (w + 2*pad - kernel_size) / stride + 1;
            top_node.stat.h = (h + 2*pad - kernel_size) / stride + 1;
            top_node.stat.c = c;
            top_node.stat.model_size = 0;
          } else {
            showErrorToast("Some parameters are lost! Please check layer: " + top_node.name);
            return 0;
          }
        } else {
          top_node.stat.w = w;
          top_node.stat.h = h;
          top_node.stat.c = c;
          top_node.stat.model_size = 0;
        }
      }

      //if (!top_list.contains(top_node.name)) {
        model_size += top_node.stat.model_size;
      //}
      //console.log(top_node.stat.model_size)
      //console.log(top_node)
      cur_top_nodes.push(top_node);
    }
    // update
    cur_bottom = cur_top;
    cur_bottom_nodes = cur_top_nodes;
    //break;
  }
  return model_size;
}

function compute_model_size_old(_node_data_array, _link_data_array) {
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


