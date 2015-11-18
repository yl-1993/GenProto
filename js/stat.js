function get_loc(start_x, start_y) {
  return (start_x + " " + start_y);
}

function compute_attr_info(_node_data_array, _link_data_array) {
  var _node_data_num = _node_data_array.length;
  var _link_data_num = _link_data_array.length;
  var _map = {};

  var _edge_to = {};
  var _edge_from = {};

  var _data;
  var _layer;
  var param_list;
  var param_num;
  // parse layers
  for (i = 0; i < _node_data_num; ++i) {
    _data = _node_data_array[i];
    _layer = {};

    _layer["name"] = _data["name"]
    _layer["category"] = _data["category"]

    param_list = get_param_list(_layers[_data.category]);
    if (param_list) {
      param_num = param_list.length;
      for (j = 0; j < param_num; ++j) {
        if (_data[param_list[j]]) {
          _layer[param_list[j]] = _data[param_list[j]];
        }
      }
    }
    if (_data["phase"]) {
      _layer["phase"] = _data["phase"];
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
    _edge_to[_link_data_array[i]["to"]].push(_link_data_array[i]["from"]);
    _edge_from[_link_data_array[i]["from"]].push(_link_data_array[i]["to"]);
  }

  // select bottom and top
  var bottom_list = [];
  var _key;
  for (_key in _map) {
    if (!_edge_to[_key]) {
      bottom_list.push(_key);
    }
  }

  var res = compute_model_size(bottom_list, _edge_from, _node_data_array);
  document.getElementById('model_size').innerHTML = res.model_size*4;
  document.getElementById('model_size_mb').innerHTML = res.model_size*4/1024/1024;
  document.getElementById('calculation').innerHTML = res.calculation;
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

function compute_layer_size(cur_top, w, h, c, model_size, calculation) {
  var top_node;
  for (i = 0; i < cur_top.length; ++i) {
    top_node = myDiagram.model.findNodeDataForKey(cur_top[i]);
    if (top_node.type == "Concat") {
      if (!top_node.stat || Object.keys(top_node.stat).length == 0){
        top_node.stat = {};
        top_node.stat.w = w;
        top_node.stat.h = h;
        top_node.stat.c = 0;
      } 
      
      top_node.stat.c += c; 
      top_node.stat.model_size = 0;
      top_node.stat.calculation = 0;
    } else {
      top_node.stat = {};
      w = parseInt(w);
      h = parseInt(h);
      c = parseInt(c);
      if (top_node.type == "Convolution" || top_node.type == "ConvolutionData") {
        var num_output = parseInt(top_node.json.convolution_param.num_output);
        var kernel_size = parseInt(top_node.json.convolution_param.kernel_size);
        var stride = parseInt(top_node.json.convolution_param.stride || 1);
        var pad = parseInt(top_node.json.convolution_param.pad || 0);
        if (num_output && kernel_size && stride) {
          top_node.stat.w = Math.floor((w + 2*pad - kernel_size)*1.0 / stride) + 1;
          top_node.stat.h = Math.floor((h + 2*pad - kernel_size)*1.0 / stride) + 1;
          top_node.stat.c = num_output;
          top_node.stat.model_size = c*(kernel_size*kernel_size)*num_output;
          top_node.stat.calculation = w*h*c*(kernel_size*kernel_size)*num_output;
        } else {
          showErrorToast("Some parameters are lost! Please check layer: " + top_node.name);
          return 0;
        }
      } else if (top_node.type == "InnerProduct" || top_node.type == "InnerProductAll") {
        var num_output = parseInt(top_node.json.inner_product_param.num_output);
        if (num_output) {
          top_node.stat.w = 1;
          top_node.stat.h = 1;
          top_node.stat.c = num_output;
          top_node.stat.model_size = (w*h*c)*num_output;
          top_node.stat.calculation = top_node.stat.model_size;
        } else {
          showErrorToast("Some parameters are lost! Please check layer: " + top_node.name);
          return 0;
        }
      } else if (top_node.type == "Pooling") {
        var kernel_size = parseInt(top_node.json.pooling_param.kernel_size);
        var stride = parseInt(top_node.json.pooling_param.stride || 1);
        var pad = parseInt(top_node.json.pooling_param.pad || 0);
        if (kernel_size && stride) {
          top_node.stat.w = Math.ceil((w + 2*pad - kernel_size)*1.0 / stride) + 1;
          top_node.stat.h = Math.ceil((h + 2*pad - kernel_size)*1.0 / stride) + 1;
          top_node.stat.c = c;
          top_node.stat.model_size = 0;
          top_node.stat.calculation = 0;
        } else {
          showErrorToast("Some parameters are lost! Please check layer: " + top_node.name);
          return 0;
        }
      } else {
        top_node.stat.w = w;
        top_node.stat.h = h;
        top_node.stat.c = c;
        top_node.stat.model_size = 0;
        top_node.stat.calculation = 0;
      }
    }

    model_size += top_node.stat.model_size;
    calculation += top_node.stat.calculation;


  }
  return {
    "model_size": model_size,
    "calculation": calculation
  };
}


function get_topology_struct(_bottom_list, _node_map, _node_dict, _node_num) {
  var top_node, stack_top;
  var topology_list = [];
  var count = 0;
  var stack = [];
  var i;
  // init
  for (i = 0; i < _bottom_list.length; ++i) {
    stack.push(_bottom_list[i]);
    _node_dict[_bottom_list[i]] = 1;
  }
  
  // search
  while(count < _node_num) {
    stack_top = stack[stack.length-1];
    top_node = _node_map[stack_top];
    // check
    if (!top_node || top_node.length == 0) {
      _node_dict[stack_top] = 2;
      topology_list.push(stack.pop());
      count += 1;
      continue;
    }
    // push
    for (i = 0; i < top_node.length; ++i) {
      if (_node_dict[top_node[i]] == 0) {      
        stack.push(top_node[i]);
        _node_dict[top_node[i]] = 1;
      } else if (_node_dict[top_node[i]] == 1) { // check whether there is a loop
        showErrorToast("There is a loop! Please check layer: "+top_node[i]);
        throw "There is a loop! Please check layer: "+top_node[i];
        return;
      } else {
        continue;
      }
    }
    // check
    if (stack_top == stack[stack.length-1]) {
      _node_dict[stack_top] = 2;
      topology_list.push(stack.pop());
      count += 1;
      continue;
    }
  }
  return topology_list;
}

function compute_model_size(bottom_list, _edge_from, _node_data_array) {
  var res = check_whc(bottom_list, _node_data_array);
  var cur_bottom = bottom_list;
  var node;
  var cur_top;
  var cur_top_nodes;
  var topology_list = [];
  var i, j;
  var w, h;
  var model_size = 0;
  var calculation = 0;
  var res;
  // get the topology structure
  var node_dict = {};
  var node_num = _node_data_array.length;
  for (i = 0; i < node_num; ++i) {
    node_dict[_node_data_array[i].name] = 0;
    _node_data_array[i].stat = {};  // prevent accumulation of 'Concat' channels
  }
  topology_list = get_topology_struct(bottom_list, _edge_from, node_dict, node_num);

  // get initial value of h,w,c
  for (i = 0; i < cur_bottom.length; ++i) {
    node = myDiagram.model.findNodeDataForKey(cur_bottom[i]);
    if (node) {
      node.stat = {}
      node.stat.w = res.w;
      node.stat.h = res.h;
      node.stat.c = res.c;
    } else {
      showErrorToast("Cannot find node: " + cur_bottom[i]);
      return 0;
    }
  }
  for (i = node_num-1; i >= 0; --i) {
    cur_node = topology_list[i];
    cur_top = _edge_from[cur_node];
    if (cur_top && cur_top.length > 0) {
      cur_top = cur_top.unique();

      node = myDiagram.model.findNodeDataForKey(cur_node);
      w = node.stat.w;
      h = node.stat.h;
      c = node.stat.c;

      // handle current top node
      res = compute_layer_size(cur_top, w, h, c, model_size, calculation);
      model_size = res.model_size;
      calculation = res.calculation;
    }
  }
  return {
    "model_size": model_size,
    "calculation": calculation
  };
}

function compute_data_memory(_node_data_array, _link_data_array) {
  return 0;
}

