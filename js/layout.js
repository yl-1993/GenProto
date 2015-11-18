function unique(arr) {
  'use strict';
  var result = [], hash = {};
  var i;
  for (i = 0, elem; (elem = arr[i]) != null; i++) {
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

function get_x_from_node(node) {
  return parseInt(node.loc.split(" ")[0])
}


function gen_loc_from_layers(_node_data_array, _link_data_array, _model) {
  'use strict';
  // modified nodeDataArray loc
  var MAX_DEPTH = 200;
  var _node_data_num = _node_data_array.length;
  var _link_data_num = _link_data_array.length;
  var _map = {};
  var start_x = -45;
  var start_y = 325;
  var delta_x = 200;
  var delta_y = -130;
  var min_depth = 1;
  var max_depth = min_depth;
  var i, j, k;
  
  // parse layers
  var _data;
  var _layer;
  var param_list;
  var param_num;
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

  // select bottom and top
  var bottom_list = [];
  var top_list = [];
  var _key;
  for (_key in _map) {
    if (!_edge_to[_key]) {
      bottom_list.push(_key);
    }
    if (!_edge_from[_key]) {
      top_list.push(_key);
    }
  }

  // Calculate position of bottom node
  var cur_node, cur_top_node;
  var cur_bottom = bottom_list;
  var cur_start_x = start_x - (cur_bottom.length - 1.0) / 2 * delta_x;
  for (i = 0; i < cur_bottom.length; ++i) {
    cur_node = myDiagram.model.findNodeDataForKey(cur_bottom[i]);
    if (top_list.length >= 2) {
      cur_node.loc = get_loc(start_x, start_y - i * delta_y);        
    } else {
      cur_node.loc = get_loc(start_x, start_y - i * delta_y); 
    }
    cur_node.layout = {};
    cur_node.layout.depth = min_depth;
  }

  // Calculate the depth and next depth of each node (BFS)
  var depth;
  var depth_list = {};
  var cur_top, single_cur_top, cur_top_num;
  while (cur_bottom.length > 0) {
    cur_top = [];
    // gather all current nodes
    for (i = 0 ; i < cur_bottom.length; ++i) {
      cur_node = myDiagram.model.findNodeDataForKey(cur_bottom[i]);
      depth = cur_node.layout.depth;
      single_cur_top = _edge_from[cur_bottom[i]];
      if (!single_cur_top) {
        continue;
      }
      for (j = 0; j < single_cur_top.length; ++j) {
        cur_top_node = myDiagram.model.findNodeDataForKey(single_cur_top[j]);
        if(cur_top_node.layout) {
          if (cur_top_node.layout.depth) {
            if (cur_top_node.layout.depth < depth + 1) {
              cur_top_node.layout.depth = depth + 1;
            }            
          } else {
            cur_top_node.layout.depth = depth + 1;
          }
        } else {
          cur_top_node.layout = {};
          cur_top_node.layout.depth = depth + 1;          
        }
        cur_top.push(single_cur_top[j]);
      }
    } 
    cur_bottom = cur_top;
  }

  // update min next depth && store the node ordered by depth
  cur_bottom = bottom_list;
  while (cur_bottom.length > 0) {
    cur_top = [];
    // gather all current nodes
    for (i = 0 ; i < cur_bottom.length; ++i) {
      cur_node = myDiagram.model.findNodeDataForKey(cur_bottom[i]);
      depth = cur_node.layout.depth;
      if (depth > max_depth) max_depth = depth;
      if (!depth_list[depth]) {
        depth_list[depth] = [];
      }
      if (!depth_list[depth].contains(cur_node)) {
        depth_list[depth].push(cur_node);
      }

      if (!cur_node.layout.nextdepth) {
        cur_node.layout.nextdepth = MAX_DEPTH; // the nextdepth of top node is MAX_DEPTH
      }
      single_cur_top = _edge_from[cur_bottom[i]];
      if (!single_cur_top) {
        continue;
      }
      for (j = 0; j < single_cur_top.length; ++j) {
        cur_top_node = myDiagram.model.findNodeDataForKey(single_cur_top[j]);
        if(cur_top_node.layout.depth < cur_node.layout.nextdepth) {
          cur_node.layout.nextdepth = cur_top_node.layout.depth;
        }
        cur_top.push(single_cur_top[j]);
      }
    } 
    cur_bottom = cur_top;
  }

  // define sort function
  var cur_depth_num;
  var bottom_x = start_x;
  var cur_depth = [];

  // cal the position of inner node
  for (i = min_depth+1; i <= max_depth; ++i) {
    cur_depth = depth_list[i];
    cur_depth_num = cur_depth.length;

    //cur_depth.sort();
    cur_start_x = start_x - (cur_depth_num - 1.0) / 2 * delta_x;
    for (j = 0; j < cur_depth_num; ++j) {
      cur_depth[j].loc =  get_loc(cur_start_x + j * delta_x, start_y + i * delta_y);     

      // find one to one, adjust its position
      cur_node = _edge_to[cur_depth[j].key];
      if (cur_node.length == 1) {      
        cur_top_node = _edge_from[cur_node[0]];
        if (cur_top_node.length == 1 && cur_top_node[0] == cur_depth[j].key) {
          cur_node = myDiagram.model.findNodeDataForKey(cur_node[0]);
          bottom_x = cur_node.loc.split(" ")[0];
          cur_depth[j].loc =  get_loc(bottom_x, start_y + i * delta_y);

        }
      } else if (cur_node.length > 1 && cur_depth[j].layout.nextdepth<MAX_DEPTH) {
        var tmp_ave_x = 0;
        for (k = 0; k < cur_node.length; ++k) {
          var tmp_cur_node = myDiagram.model.findNodeDataForKey(cur_node[k]);
          bottom_x = tmp_cur_node.loc.split(" ")[0];
          tmp_ave_x += parseInt(tmp_ave_x);
        }
        cur_depth[j].loc =  get_loc(tmp_ave_x/cur_node.length, start_y + i * delta_y);
      }
    }


    // check
    cur_depth.sort(function(a,b){
              var a_x = parseInt(a.loc.split(" ")[0]);
              var b_x = parseInt(b.loc.split(" ")[0]);
              if (a_x == b_x) {
                var bottom_a = _edge_to[a.key][0];
                var bottom_b = _edge_to[b.key][0];
                bottom_a = myDiagram.model.findNodeDataForKey(bottom_a);
                bottom_b = myDiagram.model.findNodeDataForKey(bottom_b);
                var bottom_a_x = parseInt(bottom_a.loc.split(" ")[0]);
                var bottom_b_x = parseInt(bottom_b.loc.split(" ")[0]);
                return bottom_a_x-bottom_b_x; 
              } else {
                return a_x-b_x;
              }
            });
    var tmp_node_x = get_x_from_node(cur_depth[0]);
    var tmp_next_node_x;
    for (j = 0; j < cur_depth_num-1; ++j) {
      tmp_next_node_x = get_x_from_node(cur_depth[j+1]);
      if (tmp_node_x+delta_x > tmp_next_node_x) {
        cur_depth[j+1].loc = get_loc(tmp_node_x+delta_x, start_y + i * delta_y);
        tmp_node_x = tmp_node_x+delta_x;
      } else {
        tmp_node_x = tmp_next_node_x;
      }
    }

  }

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
            if (top_list.length == 1) {
              if (j%2 == 0){
                _link_data_array[i]["fromPort"] = "R";
                _link_data_array[i]["toPort"] = "R"; 
              } else {
                _link_data_array[i]["fromPort"] = "L";
                _link_data_array[i]["toPort"] = "L"; 
              } 
            } else {
              _link_data_array[i]["fromPort"] = "L";
              _link_data_array[i]["toPort"] = "L";  
            }
          } else if (k == top_list.length - 1) {
            _link_data_array[i]["fromPort"] = "R";
            _link_data_array[i]["toPort"] = "R"; 
          }         
        }
      }
    }
  }

  _model["nodeDataArray"] = myDiagram.model["nodeDataArray"];
  _model["linkDataArray"] = _link_data_array;
  return _model.toJson();
}