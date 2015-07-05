
////////////////////////new added///////////////////////////
// Allow the user to edit text when a single node is selected
function onSelectionChanged(e) {
  'use strict';
  var node = e.diagram.selection.first();
  if (node instanceof go.Node) {
    updateProperties(node.data);
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
function updateProperties(data) {
  'use strict';
  if(data === null){
    return;
  }
  var resizeTextarea = function(element) {
    element.style.height = '24px';
    element.style.height = element.scrollHeight + 100 + 'px';
  };


  var prototxt_to_edit = json2prototxt_layer(data.json);
  var dom = document.getElementById("layer_edit");
  dom.value = prototxt_to_edit;
  resizeTextarea(dom);


  return;
}

function saveEditedLayer() {
  'use strict';
  var node = myDiagram.selection.first();
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
