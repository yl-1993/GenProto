
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

// Update the HTML elements for editing the properties of the currently selected node, if any
function updateProperties(data) {
  'use strict';
  if (data === null) {
    document.getElementById("propertiesPanel").style.display = "none";
  } else {
    var category = data.category;
    var param_list = get_param_list(_layers[category]);
    var param_default = get_param_default(_layers[category]);
    //document.getElementById("propertiesPanel").style.display = "block";
    // append div element
    appendParameters(param_list, category);
    // update value
    document.getElementById("name").value = data.name || "";
    document.getElementById("category").value = data.category || "";
    if (category != "BLOB") {
      document.getElementById("phase").value = data.phase || "";
    }
    if (param_list) {
      var param_num = param_list.length;
      for (var i = 0; i < param_num; ++i) {
        if (param_list[i].search("filler") < 0) {
          document.getElementById(param_list[i]).value = eval('data.'+param_list[i]) || "";
        } else {
          // filler default setting
          //console.log(data["weight_filler_type"]);
          // if (param_list[i] == "weight_filler") {
          //   if (!data[param_list[i]+"_type"]) {
          //     // initialize
          //     data[param_list[i]] = "default";
          //     data[param_list[i]+"_type"] = "xavier";
          //   }
          //   document.getElementById(param_list[i] + "_type").value = data[param_list[i]+"_type"] || "xavier";
          //   show_network_filler(data, document.getElementById(param_list[i] + "_type").value, param_list[i]);
          // } else if (param_list[i] == "bias_filler" ||
          //            param_list[i] == "scale_filler" ||
          //            param_list[i] == "shift_filler" ||
          //            param_list[i] == "data_filler" ) {
          //   if (!data[param_list[i]+"_type"]) {
          //     // initialize
          //     data[param_list[i]] = "default";
          //     data[param_list[i]+"_type"] = "constant";
          //   }
          //   document.getElementById(param_list[i] + "_type").value = data[param_list[i]+"_type"] || "constant";
          //   show_network_filler(data, document.getElementById(param_list[i] + "_type").value, param_list[i]);
          // }
        }

        //console.log('data.'+param_list[i]);
      }
    }
    if (param_default) {
      for (var _key_param in param_default) {
        if (document.getElementById(_key_param)) {
          document.getElementById(_key_param).placeholder = param_default[_key_param];
        }
        //console.log('data.'+param_list[i]);
      }
    }
    document.getElementById("propertiesPanel").style.display = "block";
  }
}

function appendParameters(param_list, category) {
  var parentdiv = document.getElementById("propertiesTable");
  // remove all elements except 'name'
  var childnode_list = parentdiv.childNodes;
  var childnode_num = childnode_list.length;
  //console.log(childnode_list);
  var child_start = 2;
  for (var i = child_start; i < childnode_num; ++i) {
    parentdiv.removeChild(childnode_list[child_start]);
  }
  // append new elements
  if (category != "BLOB") {
    apppendSelectNodes(parentdiv, "phase");
  }
  if (param_list) {
    var param_num = param_list.length;
    for (var i = 0; i < param_num; ++i) {
      if (param_list[i] == "weight_filler" || param_list[i] == "bias_filler" ||
          param_list[i] == "scale_filler" || param_list[i] == "shift_filler" || param_list[i] == "data_filler") {
        appendFillerNodes(parentdiv, param_list[i]);
      }
      else if (param_list[i].search("filler") >= 0) {
        continue;
      }
      else {
        appendNodes(parentdiv, param_list[i]);
      }
    }
  }
}

function appendFillerNodes(parentdiv, param) {
    var tr0 = document.createElement('tr');
    var label_td0 = document.createElement('td');
    label_td0.innerHTML = param;
    tr0.appendChild(label_td0);
    parentdiv.appendChild(tr0);

    var tr = document.createElement('tr');
    var label_td = document.createElement('td');
    var content_td = document.createElement('td');
    var select = document.createElement('select');
    label_td.innerHTML = "type: ";
    label_td.setAttribute("style", "float:right");
    select.setAttribute("id",param+"_type");
    select.setAttribute("onchange", "updateData(this.value, '"+param+"_type')");
    var option0 = document.createElement('option');
    option0.setAttribute("value", "");
    option0.innerHTML="";
    var option1 = document.createElement('option');
    option1.setAttribute("value", "constant");
    option1.innerHTML="constant";
    var option2 = document.createElement('option');
    option2.setAttribute("value", "xavier");
    option2.innerHTML="xavier";
    var option3 = document.createElement('option');
    option3.setAttribute("value", "uniform");
    option3.innerHTML="uniform";
    var option4 = document.createElement('option');
    option4.setAttribute("value", "gaussian");
    option4.innerHTML="gaussian";
    select.appendChild(option0);
    select.appendChild(option1);
    select.appendChild(option2);
    select.appendChild(option3);
    select.appendChild(option4);
    content_td.appendChild(select);
    tr.appendChild(label_td);
    tr.appendChild(content_td);
    parentdiv.appendChild(tr);

    for (var i = 0; i < _filler_info.length; ++i) {
      var tr1 = document.createElement('tr');
      var label_td1 = document.createElement('td');
      var content_td1 = document.createElement('td');
      //label_td1.innerHTML = "value: ";
      label_td1.innerHTML = _filler_info[i]+":";
      label_td1.setAttribute("style", "float:right;");
      var input1 = document.createElement('input');
      input1.setAttribute("type", "text");
      input1.setAttribute("id",param+"_"+_filler_info[i]);
      input1.setAttribute("onchange", "updateData(this.value, '"+param+"_"+_filler_info[i]+"')");
      content_td1.appendChild(input1);
      tr1.appendChild(label_td1);
      tr1.appendChild(content_td1);
      tr1.setAttribute("style","display:none;");
      parentdiv.appendChild(tr1);
    }
}

function appendNodes(parentdiv, param) {
    var tr = document.createElement('tr');
    var label_td = document.createElement('td');
    var content_td = document.createElement('td');
    label_td.innerHTML = param + ":";
    var input = document.createElement('input');
    input.setAttribute("type", "text");
    input.setAttribute("id",param);
    input.setAttribute("onchange", "updateData(this.value, '"+param+"')");
    content_td.appendChild(input);
    tr.appendChild(label_td);
    tr.appendChild(content_td);
    parentdiv.appendChild(tr);
}

function apppendSelectNodes(parentdiv, param) {
    var tr = document.createElement('tr');
    var label_td = document.createElement('td');
    var content_td = document.createElement('td');
    label_td.innerHTML = param + ":";
    var select = document.createElement('select');
    select.setAttribute("id",param);
    select.setAttribute("onchange", "updateData(this.value, '"+param+"')");
    var option0 = document.createElement('option');
    option0.setAttribute("value", "");
    option0.innerHTML="";
    var option1 = document.createElement('option');
    option1.setAttribute("value", "TRAIN");
    option1.innerHTML="TRAIN";
    var option2 = document.createElement('VALUE');
    option2.setAttribute("value", "TEST");
    option2.innerHTML="TEST";
    select.appendChild(option0);
    select.appendChild(option1);
    select.appendChild(option2);
    content_td.appendChild(select);
    tr.appendChild(label_td);
    tr.appendChild(content_td);
    parentdiv.appendChild(tr);
}

function show_network_filler(data, type, param) {
  // restore
  for (var i = 0; i < _filler_info.length; ++i) {
    document.getElementById(param + "_" + _filler_info[i]).parentNode.parentNode.setAttribute("style", "display:none;");
  }
  // display by selection
  if (type == "constant") {
    if (param == "scale_filler") {
      document.getElementById(param + "_value").value = data[param+"_value"] || 1;
    } else {
      document.getElementById(param + "_value").value = data[param+"_value"] || 0;
    }
    document.getElementById(param + "_value").parentNode.parentNode.setAttribute("style", "");
  } else if (type == "uniform") {
    document.getElementById(param + "_min").value = data[param+"_min"] || 0;
    document.getElementById(param + "_min").parentNode.parentNode.setAttribute("style", "");
    document.getElementById(param + "_max").value = data[param+"_max"] || 1;
    document.getElementById(param + "_max").parentNode.parentNode.setAttribute("style", "");
  } else if (type == "gaussian") {
    document.getElementById(param + "_mean").value = data[param+"_mean"] || 0;
    document.getElementById(param + "_mean").parentNode.parentNode.setAttribute("style", "");
    document.getElementById(param + "_std").value = data[param+"_std"] || 1;
    document.getElementById(param + "_std").parentNode.parentNode.setAttribute("style", "");
  }
}

// Update the data fields when the text is changed
function updateData(text, field) {
  'use strict';
  var node = myDiagram.selection.first();
  // maxSelectionCount = 1, so there can only be one Part in this collection
  var data = node.data;
  var category = data.category;
  if (node instanceof go.Node && data !== null) {
    var model = myDiagram.model;
    var param_list = get_param_list(_layers[category]);
    model.startTransaction("modified " + field);
    if (field === "name") {
      model.setDataProperty(data, "name", text);
    }
    else if (field === "phase"){
      model.setDataProperty(data, "phase", text);
    }
    else if (field.search("filler") >= 0) {
      if (field == "weight_filler") {
        if (!data["weight_filler_type"]) {
          data["weight_filler_type"] = "xavier";
        }
      } else {
        if (!data[field + "_type"]) {
          data[field + "_type"] = "constant";
          if (field == "scale_filler") {
            data[field + "_value"] = 1;
          } else {
            data[field + "_value"] = 0;
          }
        }
      }
      //if (data["weight_filler_type"] || data["bias_filler_type"]) {
      model.setDataProperty(data, field, text);
      //}
    } else {
      if (param_list) {
        var param_num = param_list.length;
        for (var i = 0 ; i < param_num; ++i) {
          if(field === param_list[i]) {
            model.setDataProperty(data, param_list[i], text);
          }
        }
      }
    }
    model.commitTransaction("modified " + field);
  }
  // save immediately after modification
  updateProperties(data);
  save();
}