function is_bn(_layer_type) {
  'use strict';
  if (_layer_type == "BN" || _layer_type == "BNData")
    return true;
  else
    return false;
}

function modify_inplace_layer(_layer1, _layer2, _from_key) {
  'use strict'
  if (_layer1 && !_layer2) { 
    _layer2 = _layer1;
  }
  if (_layer2) {
    _layer2.top = _from_key;
    _layer2.bottom = _from_key;
  }
  return _layer2;
}

function remove_bn_layers(_node_data_array, _link_data_array, _model) {
  'use strict';
  var i, j, k, flag;
  var _node_data_num = _node_data_array.length;
  var _link_data_num = _link_data_array.length;
  var _node, _top_node, _bottom_node;
  var _linkin, _linkout;
  var _key, _from_key;
  var _rm_node_idx_list = [];
  var _rm_link_idx_list = [];
  var _edge_to = {};
  var _edge_from = {};
  var _bn_link_map = {};

  for (i = 0; i < _link_data_num; ++i) {
    if (!_edge_to[_link_data_array[i]["to"]]) {
      _edge_to[_link_data_array[i]["to"]] = [];
    }
    if (!_edge_from[_link_data_array[i]["from"]]) {
      _edge_from[_link_data_array[i]["from"]] = [];
    }
    _bottom_node = myDiagram.model.findNodeDataForKey(_link_data_array[i]["from"]);
    _top_node = myDiagram.model.findNodeDataForKey(_link_data_array[i]["to"])
    _edge_to[_link_data_array[i]["to"]].push(_bottom_node);
    _edge_from[_link_data_array[i]["from"]].push(_top_node);
    if (is_bn(_bottom_node.type)) {
      if (!_bn_link_map[_bottom_node.key]) {
        _bn_link_map[_bottom_node.key] = {};
      }
      _bn_link_map[_bottom_node.key].linkout = _link_data_array[i];
    }
    if (is_bn(_top_node.type)) {
      if (!_bn_link_map[_top_node.key]) {
        _bn_link_map[_top_node.key] = {};
      }
      _bn_link_map[_top_node.key].linkin = _link_data_array[i]
      _bn_link_map[_top_node.key].linkin_idx = i;
    }
  }


  for (i = 0; i < _node_data_num; ++i) {
    if (is_bn(_node_data_array[i].type)) {    
      _key = _node_data_array[i].key;
      _top_node = _edge_from[_key];
      _bottom_node = _edge_to[_key];
      if (_top_node.length == 1 && _bottom_node.length == 1) {
        _top_node = _top_node[0];
        _bottom_node = _bottom_node[0];
        if (typeof(_bottom_node.top) == "string" && typeof(_top_node.bottom) == "string") {
          _top_node.bottom = _bottom_node.top;
          _from_key = _bottom_node.top;
        } else if (typeof(_bottom_node.top) == "object" && typeof(_top_node.bottom) == "string") {
          for (j = 0; j < _bottom_node.top.length; ++j) {
            if (_bottom_node.top[j] == _node_data_array[i].bottom) {
              _top_node.bottom = _bottom_node.top[j];
              _from_key = _top_node.bottom;
              break;
            }
          }
        } else if (typeof(_bottom_node.top) == "string" && typeof(_top_node.bottom) == "object") {
          for (j = 0; j < _top_node.bottom.length; ++j) {
            if (_top_node.bottom[j] == _node_data_array[i].top) {
              _top_node.bottom[j] = _bottom_node.top;
              _from_key = _bottom_node.top;
              console.log(myDiagram.model.findNodeDataForKey(_top_node.key))
              break;
            }
          }
        } else if (typeof(_bottom_node.top) == "object" && typeof(_top_node.bottom) == "object") {
          flag = false;
          for (j = 0; j < _bottom_node.top.length; ++j) {
            for (k = 0; k < _top_node.bottom.length; ++k) {
              if (_bottom_node.top[j] == _node_data_array[i].bottom &&
                  _top_node.bottom[k] == _node_data_array[i].top) {
                _top_node.bottom[k] = _bottom_node.top[j];
                _from_key = _bottom_node.top[j];
                flag = true;
                break;
              }
            }
            if (flag) break;
          }
        }
        _top_node.json.bottom = _top_node.bottom;
        // remove linkin, keep linkout
        _linkin = _bn_link_map[_key].linkin;
        _linkout = _bn_link_map[_key].linkout;
        _linkout.relu_data = modify_inplace_layer(_linkin.relu_data, _linkout.relu_data, _from_key);
        _linkout.dropout_data = modify_inplace_layer(_linkin.dropout_data, _linkout.dropout_data, _from_key);
        
        _linkout.from = _from_key;
        _rm_link_idx_list.push(_bn_link_map[_key].linkin_idx);
        // remove BN node
        _rm_node_idx_list.push(i);
        _node = myDiagram.model.findNodeDataForKey(_key);
        myDiagram.model.removeNodeData(_node);
      } else {
        showErrorToast("We only support BN with one input and on output! Please remove layer manually: " + _node_data_array[i].name);
      } 
    }
  }

  while(_rm_link_idx_list.length) {
    _link_data_array.splice(_rm_link_idx_list.pop(), 1);
  }

  showSuccessToast("remove "+_rm_node_idx_list.length+" BN layers successfully!");

  _model["nodeDataArray"] = myDiagram.model["nodeDataArray"];
  _model["linkDataArray"] = _link_data_array;
  //_model["linkDataArray"] = myDiagram.model["linkDataArray"];
  return _model.toJson();
}


function add_lr_zero_layers(_node_data_array, _model) {
  'use strict';
  var i;
  var _count = 0;
  var _node_data_num = _node_data_array.length;
  for (i = 0; i < _node_data_num; ++i) {
    if (_node_data_array[i].type == "Convolution" || _node_data_array[i].type == "ConvolutionData" 
      || _node_data_array[i].type == "InnerProduct" || _node_data_array[i].type == "InnerProductData" ) {
      if (!_node_data_array[i].json.param) {
        _node_data_array[i].json.param = [];
        _node_data_array[i].json.param[0] = {};
        _node_data_array[i].json.param[1] = {};
      }
      _node_data_array[i].json.param[0].lr_mult = 0;
      _node_data_array[i].json.param[0].decay_mult = 0;
      _node_data_array[i].json.param[1].lr_mult = 0;
      _node_data_array[i].json.param[1].decay_mult = 0;
      _count += 1;
    }
  }

  showSuccessToast("Add mult_lr=0 and decay_mult=0 to "+_count+" layers!");

  _model["nodeDataArray"] = _node_data_array;
  return _model.toJson();

}