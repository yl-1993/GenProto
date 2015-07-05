var input = '' +
  'layer {\n' +
  '  name : "conv"\n' +
  '  type: CONVOLUTION\n' +
  '  top: "conv"\n' +
  '  param {\n' +
  '    lr_mult: 1\n' +
  '    decay_mult: 1\n' +
  '  }\n' +
  '  param { \n' +
  '    lr_mult: 2 \n' +
  '    decay_mult: 0\n' +
  '  }\n' +
  '  convolution_param {\n' +
  '    num_output: 64\n' +
  '    pad: 3\n' +
  '    bias_filler {\n' +
  '      type: "constant"\n' +
  '      value: 0.2\n' +
  '    }\n' +
  '  }\n' +
  '}';

var str_sp_remove = function(str) {
  return str.replace(/\s/g, "");
};

var layer2arr = function(str) {
  var arr = str.split('\n');
  var arr0 = [];
  var i = 0;
  for (i = 0; i < arr.length; i += 1) {
    arr[i] = str_sp_remove(arr[i]);
    if (arr[i].match(/^[^:]*{$/)) {
      arr0.push(arr[i].split("{")[0] + "{");

      //single line { }
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

var parse = function(arr, start) {
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
      kv = parse(arr, i);
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

var line2kv = function(line) {
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

var layer_split = function(net) {
  var arr = net.split('\n');
  var res = [];
  var s = [];
  var i = 0;
  for (i = 0; i < arr.length; i += 1) {
    if (arr[i].match(/layer \{/)) {
      s.push(i);
    }
  }
  s.push(arr.length);
  for (i = 0; i < s.length - 1; i += 1) {
    var layer = arr.slice(s[i], s[i + 1]).join('\n');
    res.push(layer);
  }
  return res;
};

var spaces = function(num) {
  var res = "";
  var i;
  for (i = 0; i < num; i += 1) {
    res += "  ";
  }
  return res;
};

var json2prototxt_layer = function(obj) {
  return "layer " + json_obj2prototxt(obj, 0);
};

var json_obj2prototxt = function(obj, indent) {
  var res = " {\n";
  var key;
  var i, j, k;
  for (key in obj) {
    if (obj[key] instanceof Object && !(obj[key] instanceof Array)) {
      res += spaces(indent + 1) + key + " " + json_obj2prototxt(obj[key],
        indent +
        1);
    } else if (obj[key] instanceof Array) {

      for (i = 0; i < obj[key].length; i += 1) {
        if (obj[key][i] instanceof Object) {
          res += spaces(indent + 1) + key + " " + json_obj2prototxt(obj[key][i], indent + 1);
        } else {
          res += spaces(indent + 1) + key + " : " + add_quote(obj[key][i]) + "\n";
        }
      }
    } else {
      res += spaces(indent + 1) + key + " : " + add_quote(obj[key]) + "\n";
    }
  }
  res += spaces(indent) + "}\n";
  return res;
};

var add_quote = function(z) {
  if (isNaN(parseFloat(z))) {
    if (z == "TRAIN" || z == "TEST" || z == "LMDB" || z === true || z ===
      false) {
      return z;
    } else {
      return "\"" + z + "\"";
    }
  } else {
    return z;
  }
};

var arr = layer2arr(input);
// console.log(arr);
var json = parse(arr, 0);
// console.log(json[1]);
var proto = json2prototxt_layer(json[1]);
console.log(proto);
var fs = require('fs');
var gnet = fs.readFileSync('googlenet.prototxt', 'utf8');
var parse_layer = function(str) {
  var arr = layer2arr(str);
  var json = parse(arr, 0);
  return json[1];
};
var i = 0;
var gnetl = layer_split(gnet);
for (i = 0; i < 2; i += 1) {
  console.log(gnetl[i]);
  var s = parse_layer(gnetl[i]);
  console.log(s);
  var r = json2prototxt_layer(s);
  console.log(r);

}
