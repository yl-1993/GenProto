
////////////////////////new added///////////////////////////
// Allow the user to edit text when a single node is selected
function onSelectionChanged(e) {
  'use strict';
  var node = e.diagram.selection.first();
  if (node instanceof go.Node) {
    showRelationship(node);
    updateProperties(node.data);
    console.log(node.data);
  } else if (node instanceof go.Link) {
    updateLinkProperties(node.data);
    console.log(node.data)
  } else {
    updateProperties(null);
  }
}

// This is called when the user has finished inline text-editing
function onTextEdited(e) {
  'use strict';
  var tb = e.subject;
  if (tb === null || !tb.name) return;
  var node = tb.part;
  if (node instanceof go.Node) {
    updateProperties(node.data);
  } else if (node instanceof go.Link){
    //console.log(node.data);
    updateLinkProperties(node.data);
  } else {
    updateProperties(null);
  }
  //myDiagram.commandHandler.undo();
}

/* json editor
var json_editor ;


function json_edit(){
  if(json_editor){
    json_editor.destroy();
  }
  json_editor = new JSONEditor(document.getElementById("editor_holder"),{
    schema: {
        type: "object",
        properties: {
            name: { "type": "string" },
            top: {
              "type" : "array",
              "items" : {
                "type" : "string"
              }
            },
            bottom: {
              "type" : "array",
              "items" : {
                "type" : "string"
              }
            }
        }
    }
  });
  json_editor.setValue(data.json);
  }
*/


function setKeyForNodeData(data){
  // set key by calling setKeyForNodeData
  if (myDiagram.model.findNodeDataForKey(data.name) == null) {
    myDiagram.model.setKeyForNodeData(data,data.name);
    return true;
  } else {
    showErrorToast("Cannot add layer: Layer with the same name has already existed!");
    myDiagram.model.removeNodeData(data);
    return false;
  }
}


function modifyKeyForNodeData(data){
  // set key by calling setKeyForNodeData
  if (myDiagram.model.findNodeDataForKey(data.name) == data) { // new name == old name
    return true;
  } else if (myDiagram.model.findNodeDataForKey(data.name) == null) { // new name has not been used
    myDiagram.model.setKeyForNodeData(data,data.name);
    return true;
  } else { // new name has been used
    if (!data.json.include) { 
      myDiagram.model.setDataProperty(data, "name", data.key);
      showErrorToast("Cannot modify layer's name: Layer with the same name in the same phase has already existed!");
    }
    return false;
  }
}


function showRelationship(node) {
  'use strict'
  if (node == null){
    return;
  }
  var intoLinks = node.findLinksInto();
  var outofLinks = node.findLinksOutOf();
  var i = 0;
  while(intoLinks.next()) {
    if (i == 0) {
      document.getElementById('bottomLayers').innerHTML = intoLinks.value.data.from;
    } else {
      document.getElementById('bottomLayers').innerHTML += ", "+intoLinks.value.data.from;
    }
    i++;
  }
  if (i == 0) {
    document.getElementById('bottomLayers').innerHTML = "";
  } else {
    i = 0;
  }
  while(outofLinks.next()) {
    if (i == 0) {
      document.getElementById('topLayers').innerHTML = outofLinks.value.data.to;
    } else {
      document.getElementById('topLayers').innerHTML += ", "+outofLinks.value.data.to;
    }
    i++;
  }
  if (i == 0) {
    document.getElementById('topLayers').innerHTML = "";
  } else {
    i = 0;
  }
// console.log(outofLinks.hasNext())
//   console.log(intoLinks.first().data.from)
//   console.log(outofLinks.first().data.to)
  // if (outofLinks.hasNext()){
  //   outofLinks.next();
  //   console.log(outofLinks.hasNext().data.to)
  // }
//  console.log(intoLinks[0].data.from)
//  console.log(outofLinks[0].to)
  // if (outofLinks.from) {
  //   document.getElementById('bottomLayers').innerHTML = data.from;   
  // } else {
  //   document.getElementById('bottomLayers').innerHTML = "";
  // }
  // if (intoLinks.to) {
  //   document.getElementById('topLayers').innerHTML = data.to;
  // } else {
  //   document.getElementById('topLayers').innerHTML = "";
  // }
}

// Update the HTML elements for editing the properties of the currently selected node, if any
// TIPS: If you want to change the prototxt, you only need to change 'data' here
function updateProperties(data) {
  'use strict';
  if(data === null){
    return;
  }

  var i, j;
  var param_obj, param_key;
  var item_list, item_key;
  if (data.json == null){
    if (!setKeyForNodeData(data)) {
      return;
    }
    // drag and initilize the node
    data.json = {};
    
    data.json.name = data.name;
    data.json.type = data.type;
    // console.log(_layers[data.category]);
    var param_list = _layers[data.type];
    for (i = 0; i < param_list.length; ++i) {
      param_obj = param_list[i];
      for (param_key in param_obj) {
        data.json[param_key] = {};
        item_list = param_obj[param_key];
        for (j = 0 ; j < item_list.length; ++j) {
          for (item_key in item_list[j]) {
            data.json[param_key][item_key] = item_list[j][item_key];
          }
        }
      }
    }
    data.json.top = data.name;
  } else {
    //console.log('here')
    // modify the node's name
    //if (data.json.include.phase != "TRAIN" && data.json.include.phase != "TEST") {
      if (modifyKeyForNodeData(data)) {
        //return;
        data.json.name = data.name; 
        //data.json.top = data.name;
      }
    //} else {
      // key is: name + phase

    //}
  }

  var resizeTextarea = function(element) {
    element.style.height = '24px';
    element.style.height = element.scrollHeight + 100 + 'px';
  };

  console.log(data);
  //console.log(data.json);

  var prototxt_to_edit = json2prototxt_layer(data.json);
  var dom = document.getElementById("layer_edit");
  dom.value = prototxt_to_edit;
  editor_layer.setValue(dom.value);
  editor_layer.setSize("100%", 300);
  // resizeTextarea(dom); // textarea has been hided by CodeMirror


  return;
}


function updateLinkProperties(data) {
  'use strict'

  if (data.blob_name == null) {
    //data.blob_name = data.from;
    myDiagram.model.setDataProperty(data, "blob_name", data.from);
  } 
  // else {
  //   console.log(data.blob_name)
  //   data.blob_name = data.text;
  // }

  // add top and bottom
  if (data.from && data.to) {
    var fromNode = myDiagram.model.findNodeDataForKey(data.from);
    var toNode = myDiagram.model.findNodeDataForKey(data.to);
    var num_output;
    if (fromNode.json.top) {      
      if (typeof(fromNode.json.top) == "string") {
        //console.log(data)
        if (fromNode.json.top == data.old_name) {
          fromNode.json.top = data.blob_name;
        } else { // more than one top
          var original_top = fromNode.json.top;
          if (original_top != data.blob_name) {
            fromNode.json.top = [];
            fromNode.json.top.push(original_top);
            fromNode.json.top.push(data.blob_name);
          }
        }
      } else {
        var pos = fromNode.json.top.contains(data.old_name);
        if (pos <= 0) { // a new top
          fromNode.json.top.push(data.blob_name);
        } else { // modify the old 'top'
          fromNode.json.top[pos-1] = data.blob_name;
        }
      }
    } else {
      // please warn the user
      //fromNode.json.top = data.blob_name;
    }
    // fromNode.json.top = data.blob_name;
    // maybe has many bottom, modify each bottom
    if (toNode.json.bottom) {      
      if (typeof(toNode.json.bottom) == "string") {
        if (toNode.json.bottom == data.old_name) {
          toNode.json.bottom = data.blob_name;
        } else { // more than one bottom
          var original_bottom = toNode.json.bottom;
          toNode.json.bottom = [];
          toNode.json.bottom.push(original_bottom);
          toNode.json.bottom.push(data.blob_name);
        }
      } else {
        var pos = toNode.json.bottom.contains(data.old_name);
        if (pos <= 0) { // a new top
          toNode.json.bottom.push(data.blob_name);
        } else { // modify the old 'top'
          toNode.json.bottom[pos-1] = data.blob_name;
        }
      }
    } else {
      toNode.json.bottom = data.blob_name;
    }
    // update
    data.old_name = data.blob_name;
    //console.log(fromNode);
    if (fromNode.json.convolution_param) {
      num_output = fromNode.json.convolution_param.num_output;
    } else if (fromNode.json.inner_product_param) {
      num_output = fromNode.json.inner_product_param.num_output;
    } else {
      return;
    }
    data.num_output = num_output;
  }

  return;
}

function saveEditedLayer() {
  'use strict';
  var node = myDiagram.selection.first();
  if (node === null) {
    return;
  }
  // maxSelectionCount = 1, so there can only be one Part in this collection
  var text = document.getElementById("layer_edit").value;
  console.log(text)
  var data = node.data;

  var parsed = parseLayer(text);
  console.log(parsed);
  if(parsed && parsed !== null){
    data.json = parsed;
    data.name = parsed.name;
    data.top = parsed.top;
    data.bottom = parsed.bottom;
    data.type = parsed.type;
  }
  // save immediately after modification
  updateProperties(data);
  save();
  //var _model = document.getElementById("mySavedModel").value;
  //myDiagram.model = go.Model.fromJson(_model);
}


function changeBlobStatus(linkDataArray, isBlobDisplay) {
  var linkDataNum = linkDataArray.length;
  var i;
  for (i = 0; i < linkDataNum; ++i) {
    linkDataArray[i].visible = isBlobDisplay;
  }
  return linkDataArray;
}

function changeNumoutputsStatus(linkDataArray, isNumoutDisplay) {
  var linkDataNum = linkDataArray.length;
  var i;
  var fromNode;
  var num_output; 
  for (i = 0; i < linkDataNum; ++i) {
    fromNode = myDiagram.model.findNodeDataForKey(linkDataArray[i].from);
    if (fromNode && isNumoutDisplay) {
      if (fromNode.json.convolution_param) {
        num_output = fromNode.json.convolution_param.num_output;
      } else if (fromNode.json.inner_product_param) {
        num_output = fromNode.json.inner_product_param.num_output;
      } else {
        linkDataArray[i].num_output = "";
        continue;
      }
      linkDataArray[i].num_output = num_output;
      //console.log(linkDataArray[i])
    } else {
      linkDataArray[i].num_output = "";
    }
  }
  //linkDataArray = changeBlobStatus(linkDataArray, false)
  return linkDataArray;
}