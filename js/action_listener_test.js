
////////////////////////new added///////////////////////////
// Allow the user to edit text when a single node is selected
function onSelectionChanged(e) {
  'use strict';
  var node = e.diagram.selection.first();
  if (node instanceof go.Node) {
    updateProperties(node.data);
  } else if (node instanceof go.Link) {
    updateLinkProperties(node.data);
    console.log(node.data);
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
    console.log(node.data);
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
    myDiagram.model.setDataProperty(data, "name", data.key);
    showErrorToast("Cannot modify layer's name: Layer with the same name has already existed!");
    return false;
  }
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
    // modify the node's name
    if (!modifyKeyForNodeData(data)) {
      return;
    }
    data.json.name = data.name; 
    data.json.top = data.name;
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
  resizeTextarea(dom);


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
    if (typeof(fromNode.json.top) == "string") {
      if (fromNode.json.top != data.blob_name) { // more than one top
        var original_top = fromNode.json.top;
        fromNode.json.top = [];
        fromNode.json.top.push(original_top);
        fromNode.json.top.push(data.blob_name);
      }
    } else {
      if (!fromNode.json.top.contains(data.blob_name)) { // a new top
        fromNode.json.top.push(data.blob_name);
      }
    }
    // fromNode.json.top = data.blob_name;
    toNode.json.bottom = data.blob_name;
    //console.log(fromNode);
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