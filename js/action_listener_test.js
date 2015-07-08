
////////////////////////new added///////////////////////////
// Allow the user to edit text when a single node is selected
function onSelectionChanged(e) {
  'use strict';
  var node = e.diagram.selection.first();
  if (node instanceof go.Node) {
    updateProperties(node.data);
  } else if (node instanceof go.Link) {
    updateLinkProperties(node.data);
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
    updateLinkProperties(node.data);
  } else {
    updateProperties(null);
  }
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
    // drag and initilize the node
    data.json = {};
    // set key by calling setKeyForNodeData
    if (myDiagram.model.findNodeDataForKey(data.name) == null) {
      myDiagram.model.setKeyForNodeData(data,data.name);
    } else {
      //alert('This node has already existed!');
      myDiagram.model.removeNodeData(data);
      return;
    }
    
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
  } else {
    // modify the node's name
    //data.key = data.name;
    data.json.name = data.name; 
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

  data.blob_name = data.from;

  console.log(data.from)
  console.log(data.to)

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
  var _model = document.getElementById("mySavedModel").value;
  myDiagram.model = go.Model.fromJson(_model);
}
