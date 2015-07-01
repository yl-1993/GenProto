function format(str) {
  // split text by enter
  var lines = str.split('\n');
  var filtered_lines = [];
  var i = 0;
  // move the comment which is at the end of a line to the top of that line
  for (i = 0; i < lines.length; i++) {
    var position = lines[i].indexOf('#');
    if (position !== 0 && position != -1) {
      filtered_lines.push(lines[i].substr(position, lines[i].length - position));
      lines[i] = lines[i].substr(0, position);
    }
    filtered_lines.push(lines[i]);
  }
  lines = filtered_lines;
  filtered_lines = [];
  // remove the space and the tab
  for (i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('#') == -1) {
      lines[i] = lines[i].trim([' ', '\t']);
    }
  }
  // move the '{' and '}' to a new line
  for (i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('#') != -1) {
      filtered_lines.push(lines[i]);
      continue;
    } else if (lines[i].indexOf('{') == -1 && lines[i].indexOf('}') == -1) {
      filtered_lines.push(lines[i]);
      continue;
    } else {
      var start = 0;
      for (var end = 0; end < lines[i].length; end++) {
        if (lines[i][end] == '{' || lines[i][end] == '}') {
          filtered_lines.push(lines[i].substr(start, end - start));
          filtered_lines.push(lines[i].substr(end, 1));
          start = end + 1;
        }
      }
      if (start < lines[i].length) {
        filtered_lines.push(lines[i].substr(start, lines[i].length - start));
      }
    }
  }
  lines = filtered_lines;
  filtered_lines = [];
  // remove the redundant line
  for (i = 0; i < lines.length; i++) {
    if (lines[i].length !== 0) {
      filtered_lines.push(lines[i]);
    }
  }
  return filtered_lines;
}

// generate the block tree by recursion
function append_block_tree(childs, line_number, prototxt) {
  if (prototxt[line_number] == "{") {
    alert("error, unexpected {");
    return prototxt.length;
  }
  if (prototxt[line_number] == "}") {
    alert("error, {} is not allowed.");
    return prototxt.length;
  }
  var i = line_number;
  for (; i < prototxt.length - 1; i++) {
    if (prototxt[i + 1] != "{") {
      var node = {
        "start": i,
        "end": i + 1,
        "childs": []
      };
      childs.push(node);
    } else {
      var node = {
        "start": i,
        "end": null,
        "childs": []
      };
      node["end"] = append_block_tree(node["childs"], i + 2, prototxt);
      childs.push(node);
      i = node["end"] - 1;
    }
    if (prototxt[i + 1] == "}") {
      return i + 2;
    }
  }
  return i;
}

// generate the tree which contains the block position
function get_block_tree(prototxt) {
  var tree = {
    "start": 0,
    "end": null,
    "childs": []
  };
  var curr_line_number = 0;
  tree["end"] = append_block_tree(tree["childs"], curr_line_number, prototxt);
  // if the last line is not "}"
  if (tree["end"] != prototxt.length) {
    var node = {
      "start": prototxt.length - 1,
      "end": prototxt.length,
      "childs": []
    };
    tree["childs"].push(node);
    tree["end"] = prototxt.length;
  }
  return tree;
}


// generate the proto tree by recursion
function append_proto_tree(proto_tree_value, block_tree_childs, father,
  prototxt) {
  for (var i = 0; i < block_tree_childs.length; i++) {
    var start = block_tree_childs[i]["start"];
    if (block_tree_childs[i]["childs"].length == 0) {
      if (prototxt[start][0] == '#') {
        var node = {
          "key": "comment",
          "value": prototxt[start],
          "father": father
        };
        proto_tree_value.push(node);
      } else {
        var elements = prototxt[start].split(':');
        if (elements.length != 2) {
          alert("error in line: " + prototxt[start]);
          return;
        }
        // format value
        var value = elements[1];
        if (isNaN(value) == false) {
          value = Number(value);
        } else if (value == "true") {
          value = true;
        } else if (value == "false") {
          value = false;
        } else {
          value = remove_quotation(value);
        }
        var node = {
          "key": elements[0].toLowerCase(),
          "value": value,
          "father": father
        };
        proto_tree_value.push(node);
      }
    } else {
      var node = {
        "key": prototxt[start].toLowerCase(),
        "value": [],
        "father": father
      };
      append_proto_tree(node["value"], block_tree_childs[i]["childs"], node,
        prototxt);
      proto_tree_value.push(node);
    }
  }
}

// generate the proto tree which contains the proto information
function get_proto_tree(block_tree, prototxt) {
  var tree = {
    "key": "tree",
    "value": [],
    "father": null
  };
  append_proto_tree(tree["value"], block_tree["childs"], tree, prototxt);
  return tree;
}

// storage the basic information of the layers
function get_layers(proto_tree) {
  var layers = {};
  for (var i = 0; i < proto_tree["value"].length; i++) {
    if (proto_tree["value"][i]["key"] == "layer") {
      var layer_params = proto_tree["value"][i]["value"];
      var layer_key = null;
      var layer_value = {
        "obj_index": i,
        "name": null,
        "type": null,
        "top": [],
        "bottom": []
      };
      // get top and bottom blobs
      for (var j = 0; j < layer_params.length; j++) {
        if (layer_params[j]["key"] == "top") {
          layer_value["top"].push(layer_params[j]["value"]);
        }
        if (layer_params[j]["key"] == "bottom") {
          layer_value["bottom"].push(layer_params[j]["value"]);
        }
      }
      // get layer name and type
      for (var j = 0; j < layer_params.length; j++) {
        if (layer_params[j]["key"] == "name") {
          layer_value["name"] = layer_params[j]["value"];
        }
        if (layer_params[j]["key"] == "type") {
          layer_value["type"] = layer_params[j]["value"].toUpperCase();
        }
      }
      if (layer_value["name"] == null) {
        alert("error, all layers must have a name.");
      }
      if (layer_value["type"] == null) {
        alert("error, all layers must have a type.");
      }
      // consider train and test phase
      layer_key = layer_value["name"];
      for (var j = 0; j < layer_params.length; j++) {
        if (layer_params[j]["key"] == "include") {
          var include_params = layer_params[j]["value"];
          for (var k = 0; k < include_params.length; k++) {
            if (include_params[k]["key"] == "phase") {
              layer_key += ("_" + include_params[k]["value"].toLowerCase());
            }
          }
        }
      }
      // check whether the layer name is existed
      if (layers[layer_key] != undefined) {
        alert("error, more than one layers called " + layers[layer_key]["name"] +
          ".");
      } else {
        layers[layer_key] = layer_value;
      }
    }
  }
  return layers;
}


function get_node_data_array(layers) {
  var node_data_array = [];
  var blobs = {};
  for (var layer_key in layers) {
    node_data_array.push({
      "key": layer_key + "_layer",
      "name": layers[layer_key]["name"],
      "category": layers[layer_key]["type"]
    });
    for (var i = 0; i < layers[layer_key]["top"].length; i++) {
      var blob_name = layers[layer_key]["top"][i];
      blobs[blob_name + "_blob"] = {
        "key": blob_name + "_blob",
        "name": blob_name,
        "category": "BLOB"
      };
    }
    for (var i = 0; i < layers[layer_key]["bottom"].length; i++) {
      var blob_name = layers[layer_key]["bottom"][i];
      blobs[blob_name + "_blob"] = {
        "key": blob_name + "_blob",
        "name": blob_name,
        "category": "BLOB"
      };
    }
  }
  for (var blob_key in blobs) {
    node_data_array.push(blobs[blob_key]);
  }
  return node_data_array;
}

function get_link_data_array(layers) {
  var link_data_array = [];
  for (var layer_key in layers) {
    var bottom_array = layers[layer_key]["bottom"];
    var top_array = layers[layer_key]["top"];
    for (var i = 0; i < bottom_array.length; i++) {
      link_data_array.push({
        "from": bottom_array[i] + "_blob",
        "to": layer_key + "_layer",
        "fromPort": "T",
        "toPort": "B"
      });
    }
    for (var i = 0; i < top_array.length; i++) {
      link_data_array.push({
        "from": layer_key + "_layer",
        "to": top_array[i] + "_blob",
        "fromPort": "T",
        "toPort": "B"
      });
    }
  }
  return link_data_array;
}
