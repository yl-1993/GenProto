var str_sp_remove = function(str) {
  'use strict';
  return str.replace(/\s/g, "");
};

// translate type to category for parsing
var type2category = function(str) {
  'use strict';
  str = str.toUpperCase();
  if (str.search("CONVOLUTION")>=0 || str == "POOLING" || str == "INNERPRODUCT" || str == "DATA"){ // type is pooling
    return str;
  } else if (str.search("LOSS") >= 0 || str.search("ACCURACY") >= 0) { // contain loss or accuracy
    return "LOSS";
  } else { // other type, such as LRN, BN, CONCAT
    return "OTHERS";
  }
}

//split a prototxt layer string to array
var layer2arr = function(str) {
  'use strict';
  var arr = str.split('\n');
  var arr0 = [];
  var i = 0;
  for (i = 0; i < arr.length; i += 1) {
    arr[i] = str_sp_remove(arr[i]);
    //console.log(arr[i])
    if (arr[i].match(/^[^:]*{.*$/)) {
      arr0.push(arr[i].split("{")[0] + "{");

      //handle single line { }
      var rest = arr[i].split("{")[1];
      if (rest && rest.match(/\}/)) {
        arr0.push(rest.split("}")[0]);
        arr0.push("}");
      }

    } else if (arr[i].match(/^[^:]*:.*/)) {
      arr0.push(arr[i]);
    } else if (arr[i].match(/\}/)) {
      arr0.push('}');
    }
  }

  if (arr0[0] !== "layer{") {
    return "error";
  }
  return arr0;
};

//parse array of layer string to [key, value, next] start from :start
// when meet same key , will turn the value to array
var parseIter = function(arr, start) {
  'use strict';
  if (!arr[start].match(/\{/)) {
    return "error";
  }
  var i = start + 1;
  var key = arr[start].split("{")[0];
  var value = {};
  var kv;
  while (arr[i] != "}") {
    if (arr[i].match(/^[^:]*:.*$/)) {
      kv = line2kv(arr[i]);
      i += 1;
    } else if (arr[i].match(/^[^\{]*\{/)) {
      kv = parseIter(arr, i);
      i = kv[2];
    }
    if (value[kv[0]]) {
      if (!(value[kv[0]] instanceof Array)) {
        value[kv[0]] = [value[kv[0]]];
      }
      value[kv[0]].push(kv[1]);
    } else {
      value[kv[0]] = kv[1];
    }
  }
  return [key, value, i + 1];
};

var parseLayer = function(text){
  'use strict';
  var arr = layer2arr(text);
  var parsed = parseIter(arr, 0);
  if(parsed == "error"){
    return null;
  }else{
    return parsed[1];
  }
};

var line2kv = function(line) {
  'use strict';
  var kv = line.split(":");
  if (!kv[1].match(/".*"/)) {
    if (!isNaN(parseFloat(kv[1]))) {
      kv[1] = parseFloat(kv[1]);
    } else if (kv[1] == 'true') {
      kv[1] = true;
    } else if (kv[1] == 'false') {
      kv[1] = false;
    }
  } else {
    kv[1] = /"(.*)"/.exec(kv[1])[1];
  }
  return kv;
};

var format_net = function(net) {
  // add \n before 'layer' 
  var pattern1 = "layer";
  var pattern2 = "{";
  var net1 = "", net2 = "";
  var start_pos = 0, end_pos = 0, tmp_pos = 0;
  var i = 0;
  while(true) {
    end_pos = net.indexOf(pattern1, start_pos);
    if (end_pos == -1) {
      net1 += net.substr(start_pos, net.length - start_pos);
      break;
    }
    tmp_pos = end_pos - 1;
    //while(net[tmp_pos] == " ") tmp_pos--;
    if (net[tmp_pos] != "\n" && (net[tmp_pos] == " " || net[tmp_pos] == "}")) {
      net1 += net.substr(start_pos, tmp_pos - start_pos + 1) + "\n" + pattern1;
    } else {
      net1 += net.substr(start_pos, tmp_pos - start_pos + 1) + pattern1;      
    }
    start_pos = end_pos + pattern1.length;
  }
  // remove all '\n' before '{'
  start_pos = 0;
  while(true) {
    end_pos = net1.indexOf(pattern2, start_pos);
    if (end_pos == -1) {
      net2 += net1.substr(start_pos, net1.length - start_pos);
      break;
    }
    tmp_pos = end_pos - 1;
    while(net1[tmp_pos] == " ") tmp_pos--;
    
    if (net1[tmp_pos] != "\n") {
      net2 += net1.substr(start_pos, tmp_pos - start_pos + 1) + pattern2;
    } else {
      while(net1[tmp_pos] == "\n" || net1[tmp_pos] == " ") tmp_pos--;
      net2 += net1.substr(start_pos, tmp_pos - start_pos + 1) + pattern2;    
    }
    start_pos = end_pos + pattern2.length;
  }
  return net2;
};


var remove_comment = function(net) {
  var arr = net.split('\n');
  var i;
  var arr_len = arr.length;
  var net2 = '';
  for (i = 0; i < arr_len; ++i) {
    line_arr = arr[i].split('#');
    net2 += line_arr[0] + '\n';// only keep the content in the first item
  }
  return net2;
}


var layer_split = function(net) {
  'use strict';
  net = remove_comment(net);
  net = format_net(net);
  var arr = net.split('\n');
  var res = [];
  var s = [];
  var i = 0;
  for (i = 0; i < arr.length; i += 1) {
    if (arr[i].match(/layer\s*\{/)) {
      s.push(i);
    } else if (arr[i].match(/layers\s*\{/) || arr[i].match(/layers\s*/)) {
      //showErrorToast('Please upgrade your prototxt! The layer should start with "layer".');
      return [];
    }
  }
  s.push(arr.length);
  for (i = 0; i < s.length - 1; i += 1) {
    var layer = arr.slice(s[i], s[i + 1]).join('\n');
    res.push(layer);
  }
  return res;
};

var generate_link = function(nodes) {
  'use strict';
  var blobs = {};
  var i, j, k;
  for (i = 0; i < nodes.length; i += 1) {
    if (nodes[i].type == 'ReLU' && nodes[i].top == nodes[i].bottom) {
      continue;
    }
    if (nodes[i].type == 'Dropout' && nodes[i].top == nodes[i].bottom) {
      continue;
    }    
    if (nodes[i].top && (nodes[i].top instanceof Array)) {
      // 2 or more tops
      for (j = 0; j < nodes[i].top.length; j += 1) {
        if (!blobs[nodes[i].top[j]]) {
          blobs[nodes[i].top[j]] = {
            "blob_name" : nodes[i].top[j],
            "old_name" : nodes[i].top[j],
            "from": [nodes[i].key],
            "to": []
          };
        } else {
          blobs[nodes[i].top[j]].from.push(nodes[i].key);
        }
      }
    } else if (nodes[i].top) {
      if (!blobs[nodes[i].top]) {
        blobs[nodes[i].top] = {
          "blob_name" : nodes[i].top,
          "old_name" : nodes[i].top,
          "from": [nodes[i].key],
          "to": []
        };
      } else {
        blobs[nodes[i].top].from.push(nodes[i].key);
      }
    }
  }
  // every blob is like {from:[bottom layers], to: [top layers]}
  for (i = 0; i < nodes.length; i += 1) {
    if (nodes[i].type == 'ReLU' && nodes[i].top == nodes[i].bottom) {
      continue;
    }
    if (nodes[i].type == 'Dropout' && nodes[i].top == nodes[i].bottom) {
      continue;
    }
    if (nodes[i].bottom && (nodes[i].bottom instanceof Array)) {
      for (j = 0; j < nodes[i].bottom.length; j += 1) {
        if (blobs[nodes[i].bottom[j]]) {
          blobs[nodes[i].bottom[j]].to.push(nodes[i].key);
        }
      }
    } else if (nodes[i].top) {
      if (blobs[nodes[i].bottom]) {
        blobs[nodes[i].bottom].to.push(nodes[i].key);
      }
    }
  }
  for (i = 0; i < nodes.length; i += 1) {
    if (nodes[i].type == 'ReLU' && nodes[i].top == nodes[i].bottom) {
      if (blobs[nodes[i].top]) {
        blobs[nodes[i].top].text = "ReLU";
      }
    }
    if (nodes[i].type == 'Dropout' && nodes[i].top == nodes[i].bottom) {
      if (blobs[nodes[i].top]) {
        if (blobs[nodes[i].top].text == "ReLU") {
          blobs[nodes[i].top].text = "ReLU&Dropout";
        } else {
          blobs[nodes[i].top].text = "Dropout";
        }
      }
    }
  }
  var links = [];
  for (var key in blobs) {
    var blob = blobs[key];
    for (i = 0; i < blob.to.length; i += 1) {
      for (j = 0; j < blob.from.length; j += 1) {
        var newLink = {
          blob_name: blob.blob_name,
          old_name: blob.old_name,
          from: blob.from[j],
          to: blob.to[i],
          visible: true,
          fromPort: 'T',
          toPort: 'B'
        };
        if (blob.text) {
          newLink.text = blob.text;
          //newLink.visible = true;
        }
        links.push(newLink);
      }
    }
  }
  return links;

};

function wrap_model(nodes) {
  'use strict';
  var i, j, k;
  var res = [];

  for (i = 0; i < nodes.length; i += 1) {
    var new_node = {
      json: nodes[i],
      name: nodes[i].name
    };
    if(nodes[i].top){
      new_node.top = nodes[i].top;
    }
    if(nodes[i].bottom){
      new_node.bottom = nodes[i].bottom;
    }
    if(nodes[i].type){
      new_node.type = nodes[i].type;
      new_node.category = type2category(nodes[i].type);
    }
    if (nodes[i].include) {
      new_node.key = nodes[i].name + '_' + nodes[i].include.phase;
    } else {
      new_node.key = nodes[i].name;
    }
    res.push(new_node);
  }
  return res;
}
var removeReluLayer = function(nodes, links) {
  'use strict';
  var res = [];
  var i;
  var link_hash = {};
  for (i = 0; i < links.length; i += 1){
    link_hash[links[i].blob_name] = links[i];
  }
  //console.log(link_hash);
  for (i = 0; i < nodes.length; i += 1) {
    if (nodes[i].type == 'ReLU' && nodes[i].top == nodes[i].bottom) {
      if(link_hash[nodes[i].top]){
        link_hash[nodes[i].top].relu_data = nodes[i].json;
      }
      continue;
    }
    if (nodes[i].type == 'Dropout' && nodes[i].top == nodes[i].bottom) {
      if(link_hash[nodes[i].top]){
        link_hash[nodes[i].top].dropout_data = nodes[i].json;
      }
      continue;
    }
    res.push(nodes[i]);
  }
  return res;
};


function gen_model_from_prototxt(prototxt) {
  'use strict';
  
  // parsing the prototxt
  var layers_arr = layer_split(prototxt);
  var nodeDataArray = [];
  var linkDataArray = [];
  var jsonArray = [];
  var i;
  for (i = 0; i < layers_arr.length; i += 1) {
    var layer = parseIter(layer2arr(layers_arr[i]), 0)[1];
    jsonArray.push(layer);
  }
  nodeDataArray = wrap_model(jsonArray);

  linkDataArray = generate_link(nodeDataArray);
  nodeDataArray = removeReluLayer(nodeDataArray, linkDataArray);
  var _struct_json = {};
  _struct_json["class"] = "go.GraphLinksModel";
  _struct_json["linkFromPortIdProperty"] = "fromPort";
  _struct_json["linkToPortIdProperty"] = "toPort";
  _struct_json["nodeDataArray"] = nodeDataArray;
  _struct_json["linkDataArray"] = linkDataArray;

  return _struct_json;
  // var _model = go.Model.fromJson(_struct_json);
  // document.getElementById("mySavedModel").value = gen_loc_from_layers(_model[
  //   "nodeDataArray"], _model["linkDataArray"], _model);
  // return gen_loc_from_layers(_model[
  //   "nodeDataArray"], _model["linkDataArray"], _model);
  // load();

}



/** Multi Thread **/
onmessage =function (evt){

  var d = evt.data;
  var res = gen_model_from_prototxt(d.prototxt);
  postMessage( res );
}
