

function find_all(source, pattern) {
  var index = [];
  for (var i = 0; i < source.length - pattern.length + 1; i++) {
    for (var j = 0; j < pattern.length; j++) {
      if (source[i+j] != pattern[j]) {
        break;
      }
      if (j == pattern.length - 1) {
        index.push(i);
      }
    }
  }
  return index;
}

function split_text(source, index) {
  var result = [];
  for (var i = 0; i < index.length - 1; i++) {
    result.push(source.substr(index[i], index[i+1]-index[i]));
  }
  return result;
}

function trim(source) {
  var result = "";
  for (var i = 0; i < source.length; i++) {
    if (source[i] != '{' && source[i] != '}' && source[i] != ' ' && source[i] != '\n' && source[i] != '\t') {
      result += source[i];
    }
  }
  return result;
}

function sort_number(a, b) {
  return a - b;
}

function rm_quotation(str) {
  if (str) {
    var len = str.length;
    if (len > 2) {
      if (str[0] == "\"" && str[len - 1] == "\"") {
        return str.substr(1, len-2);
      } else {
        return str;
      }
    }
  }
  return str;
}

function gen_model_from_prototxt() {

  // generate nodeDataArray and linkDataArray by parsing prototxt
  var key_list = ["name", "batch_size", "layers", "bottom:", "top:", "phase:", "include", "num_output", "inner_product_param", "type:",
  "raw_data_param", "data_param","bn_param","data_source:", "label_source:", "num:", "height:", "width:", "channel:", "use_memory:", "pool:","\"pool\"", "source:","image_data_param:",
  "DB_backend:", "rand_skip:", "shuffle:", "new_height:", "new_width:", "scale:", "mean_file:", "crop_size:", "mirror:", "pooling_param", "pad:", "pad_h:", "pad_w:",
  "kernel_size:", "kernel_h:", "kernel_w:", "stride:", "stride_h:", "stride_w:", "bias_term:", "convolution_param", "relu_param", "negative_slope:",
  "dropout_param", "dropout_ratio:"];
  var filler_list = ["weight_filler", "bias_filler", "scale_filler", "shift_filler", "data_filler"];
  var prototxt = document.getElementById("prototxt").value;

  // remove comment in prototxt
  var prototxt_tmp = "";
  var prototxt_line = prototxt.split('\n');
  for (var i = 0; i < prototxt_line.length; ++i) {
    if (trim(prototxt_line[i])[0] == "#") {
      continue;
    }
    prototxt_tmp += prototxt_line[i];
  }
  prototxt = prototxt_tmp;

  prototxt += "layers";
  var tmp = find_all(prototxt, "layers");
  var protos = split_text(prototxt, tmp);
  console.log(protos);
  var layers = {};
  for (var i = 0; i < protos.length; i++) {
    var field_index = [];
    var layer_obj = {};

    //console.log(protos[i]);

    // parsing fillers
    var _len = protos[i].length;
    for (var j = 0; j < filler_list.length; ++j) {
      var tmp_start = find_all(protos[i], filler_list[j]);
      if (tmp_start.length == 1) {
        var tmp_end = protos[i].indexOf("}", tmp_start[0]);
        if (tmp_end >= 0) {
          var tmp_field_index = [];
          var tmp_protos_str = protos[i].substr(tmp_start[0], tmp_end - tmp_start[0]) + _filler_info[0];
          protos[i] = protos[i].substr(0, tmp_start[0]) + protos[i].substr(tmp_end+1, _len - tmp_end);
          //console.log(tmp_protos_str);
          var tmp = find_all(tmp_protos_str, "type");
          for (var k = 0; k < tmp.length; ++k) {
            tmp_field_index.push(tmp[k]);
          }
          // check other param
          for (var m = 0; m < _filler_info.length; ++m) {
            var tmp = find_all(tmp_protos_str, _filler_info[m]);
            for (var k = 0; k < tmp.length; ++k) {
              tmp_field_index.push(tmp[k]);
            }
          }
          tmp_field_index.sort(sort_number);
          var tmp_fields = split_text(tmp_protos_str, tmp_field_index);
          console.log(tmp_fields);
          for (var k = 0; k < tmp_fields.length; ++k) {
            tmp_fields[k] = trim(tmp_fields[k]);
            var pos = find_all(tmp_fields[k], ":");
            if (pos.length == 0) {
              continue;
            }
            if (pos.length != 1) {
              console.log("Error: "+filler_list[j]);
              //alert("Error: "+filler_list[j]);
            }
            pos = pos[0];
            var key = trim(tmp_fields[k].substr(0, pos));
            var value = trim(tmp_fields[k].substr(pos+1, tmp_fields[k].length-pos-1));
            if (!layer_obj[filler_list[j]]) {
              layer_obj[filler_list[j]] = "default";
            }
            layer_obj[filler_list[j]+"_"+key] = value;//rm_quotation(value);
          }
        }
      } else if(tmp_start.length > 1) {
        console.log("More than one "+ filler_list[j] +" in the same layer!");
        //alert("More than one "+ filler_list[j] +" in the same layer!");
      }
    }

    console.log(layer_obj);
    //console.log(protos[i]);

    // after removing 'fillers'
    protos[i] += "layers";
    for (var j = 0; j < key_list.length; j++) {
      var tmp = find_all(protos[i], key_list[j]);
      for (var k = 0; k < tmp.length; k++) {
        field_index.push(tmp[k]);
      }
    }
    field_index.sort(sort_number);
    fields = split_text(protos[i], field_index);
    console.log(fields);
    var top_value = [];
    var bottom_value = [];
    for (var j = 0; j < fields.length; j++) {
      fields[j] = trim(fields[j]);
      var pos = find_all(fields[j], ":");
      if (pos.length == 0) {
        continue;
      }
      if (pos.length != 1) {
        //alert("Error:" + fields[j]);
        console.log("Error:" + fields[j]);
      }
      pos = pos[0];
      var key = trim(fields[j].substr(0, pos));
      var value = trim(fields[j].substr(pos+1, fields[j].length-pos-1));
      if (value.length == 0) {
        continue;
      }
      if (key == "top") {
        top_value.push(value);
      }
      else if (key == "bottom") {
        bottom_value.push(value);
      }
      else {
        layer_obj[key] = value;
      }
    }
    layer_obj["name"] = rm_quotation(layer_obj["name"]);
    layer_obj["top"] = top_value;
    layer_obj["bottom"] = bottom_value;
    if (layer_obj["phase"]) {
      layers[layer_obj["name"]+layer_obj["phase"]+"***"] = layer_obj;
    } else {
      layers[layer_obj["name"]+"***"] = layer_obj;
    }
  }
  // generate linkDataArray
  //console.log(layers);
  var nodeDataArray = [];
  var linkDataArray = [];
  var blobDict = {};
  for (var key in layers) {
    var value = layers[key];
    var _tmp_obj = {};
    for (var _layer_key in value) {
      if (_layer_key == "top" || _layer_key == "bottom") {
        for (var i = 0; i < value[_layer_key].length; ++i) {
          value[_layer_key][i] = rm_quotation(value[_layer_key][i]);
          //console.log(value[_layer_key]);
          blobDict[value[_layer_key][i]] = "BLOB";
        }
        continue;
      }
      if (_layer_key == "type") {
        _tmp_obj["category"] = value[_layer_key];
        continue;
      }
      if (_layer_key == "name") {
        if (value["phase"]) {
          _tmp_obj["key"] = value[_layer_key] + value["phase"] + "***";
        } else {
          _tmp_obj["key"] = value[_layer_key] + "***";
        }
      }
      _tmp_obj[_layer_key] = rm_quotation(value[_layer_key]);
    }
    nodeDataArray.push(_tmp_obj);
    for (var i = 0; i < value["top"].length; i++) {
      var to = value["top"][i];
      linkDataArray.push({"from":key, "to":to, "fromPort":"T", "toPort":"B"});
    }
    for (var i = 0; i < value["bottom"].length; i++) {
      var from = value["bottom"][i];
      linkDataArray.push({"from":from, "to":key, "fromPort":"T", "toPort":"B"});
    }
  }
  for (var _blob in blobDict) {
    var _tmp_obj = {};
    _tmp_obj["key"] = _blob;
    _tmp_obj["name"] = _blob;
    _tmp_obj["category"] = "BLOB";
    nodeDataArray.push(_tmp_obj);
  }
  console.log(nodeDataArray);

  var _struct_json = {};
  _struct_json["class"] = "go.GraphLinksModel";
  _struct_json["linkFromPortIdProperty"] = "fromPort";
  _struct_json["linkToPortIdProperty"] = "toPort";
  _struct_json["nodeDataArray"] = nodeDataArray;
  _struct_json["linkDataArray"] = linkDataArray;

  var _model = go.Model.fromJson(_struct_json);

  document.getElementById("mySavedModel").value = gen_loc_from_layers(_model["nodeDataArray"], _model["linkDataArray"], _model);

  load();
}
