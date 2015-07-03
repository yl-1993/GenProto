// go.js diagram settings
function init() {
  if (window.genProto) genProto(); // init for these samples -- you don't need to call this
  var $ = go.GraphObject.make; // for conciseness in defining templates

  myDiagram =
    $(go.Diagram, "myDiagram", // must name or refer to the DIV HTML element
      {
        initialContentAlignment: go.Spot.Center,
        allowDrop: true, // must be true to accept drops from the Palette
        "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom, // enable mouse wheel event
        "LinkDrawn": showLinkLabel, // this DiagramEvent listener is defined below
        "LinkRelinked": showLinkLabel,
        "animationManager.duration": 800, // slightly longer than default (600ms) animation
        "ChangedSelection": onSelectionChanged,
        "TextEdited": onTextEdited,
        mouseOver: doMouseOver,
        "undoManager.isEnabled": true // enable undo & redo
      });

  // when the document is modified, add a "*" to the title and enable the "Save" button
  myDiagram.addDiagramListener("Modified", function(e) {
    var button = document.getElementById("SaveButton");
    if (button) button.disabled = !myDiagram.isModified;
    var idx = document.title.indexOf("*");
    if (myDiagram.isModified) {
      if (idx < 0) document.title += "*";
    } else {
      if (idx >= 0) document.title = document.title.substr(0, idx);
    }
  });

  // helper definitions for node templates

  function nodeStyle() {
    return [
      // The Node.location comes from the "loc" property of the node data,
      // converted by the Point.parse static method.
      // If the Node.location is changed, it updates the "loc" property of the node data,
      // converting back using the Point.stringify static method.
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify), {
        // the Node.location is at the center of each node
        locationSpot: go.Spot.Center,
        //isShadowed: true,
        //shadowColor: "#888",
        // handle mouse enter/leave events to show/hide the ports
        mouseEnter: function(e, obj) {
          showPorts(obj.part, true);
        },
        mouseLeave: function(e, obj) {
          showPorts(obj.part, false);
        }
      }
    ];
  }

  // Define a function for creating a "port" that is normally transparent.
  // The "name" is used as the GraphObject.portId, the "spot" is used to control how links connect
  // and where the port is positioned on the node, and the boolean "output" and "input" arguments
  // control whether the user can draw links from or to the port.
  function makePort(name, spot, output, input) {
    // the port is basically just a small circle that has a white stroke when it is made visible
    return $(go.Shape, "Circle", {
      fill: "transparent",
      stroke: null, // this is changed to "white" in the showPorts function
      desiredSize: new go.Size(8, 8),
      alignment: spot,
      alignmentFocus: spot, // align the port on the main Shape
      portId: name, // declare this object to be a "port"
      fromSpot: spot,
      toSpot: spot, // declare where links may connect at this port
      fromLinkable: output,
      toLinkable: input, // declare whether the user may draw links to/from here
      cursor: "pointer" // show a different cursor to indicate potential link point
    });
  }


  function textStyle() {
    return {
      font: "bold 11pt Helvetica, Arial, sans-serif",
      stroke: "white"
    };
  }

  //////////////////////////////// BEGIN: MOUSEOVER /////////////////////////////////
  function doMouseOver(e) {
    if (e === undefined) e = myDiagram.lastInput;
    var doc = e.documentPoint;
    // find all Nodes that are within 100 units
    var list = myDiagram.findObjectsNear(doc, 100, null, function(x) {
      return x instanceof go.Node;
    });
    // now find the one that is closest to e.documentPoint
    var closest = null;
    var closestDist = 999999999;
    list.each(function(node) {
      var dist = doc.distanceSquaredPoint(node.getDocumentPoint(go.Spot.Center));
      if (dist < closestDist) {
        closestDist = dist;
        closest = node;
      }
    });
    highlightNode(e, closest);
  }

  // Called with a Node (or null) that the mouse is over or near
  function highlightNode(e, node) {
    if (node !== null) {
      var shape = node.findObject("SHAPE");
      shape.stroke = "gray";
      if (lastStroked !== null && lastStroked !== shape) lastStroked.stroke =
        null;
      lastStroked = shape;
      updateInfoBox(e.viewPoint, node.data);
    } else {
      if (lastStroked !== null) lastStroked.stroke = null;
      lastStroked = null;
      document.getElementById("infoBoxHolder").innerHTML = "";
    }
  }

  var diagramDiv = document.getElementById("myDiagram");
  // Make sure the infoBox is hidden when the mouse is not over the Diagram
  diagramDiv.addEventListener("mouseout", function(e) {
    if (lastStroked !== null) lastStroked.stroke = null;
    lastStroked = null;

    var infoBox = document.getElementById("infoBox");
    var elem = document.elementFromPoint(e.clientX, e.clientY);
    if (elem === infoBox || elem.parentNode === infoBox) {
      var box = document.getElementById("infoBoxHolder");
      box.style.left = parseInt(box.style.left) + "px";
      box.style.top = parseInt(box.style.top) + 30 + "px";
    } else {
      var box = document.getElementById("infoBoxHolder");
      box.innerHTML = "";
    }
  }, false);

  // This function is called to update the tooltip information
  // depending on the bound data of the Node that is closest to the pointer.
  function updateInfoBox(mousePt, data) {
    var box = document.getElementById("infoBoxHolder");
    if (data.category == "CONVOLUTION") {
      var x =
        "<div id='infoBox'>" +
        "<div>" + data.name;
      var str_num_output = "";
      var str_kernel_size = " ";
      var str_map_size = " ";
      if (data.num_output) {
        str_num_output += ":" + data.num_output;
      }
      if (data.kernel_size) {
        str_kernel_size += data.kernel_size + "*" + data.kernel_size +
          "filters";
      }
      if (data._map_hsize && data._map_wsize) {
        str_map_size += "@" + data._map_hsize + "*" + data._map_wsize;
      }
      x += str_num_output + str_kernel_size + str_map_size + "</div></div>";

      box.innerHTML = x;
      box.style.left = mousePt.x + 300 + "px";
      box.style.top = mousePt.y + 70 + "px";
    } else {
      box.innerHTML = "";
    }
  }
  //////////////////////////////// END /////////////////////////////////

  // define the Node templates for regular nodes

  var lightText = 'black';

  myDiagram.nodeTemplateMap.add("", // the default category
    $(go.Node, "Spot", nodeStyle(),
      // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
      $(go.Panel, "Auto",
        $(go.Shape, "RoundedRectangle", {
            name: "SHAPE",
            strokeWidth: 3,
            fill: "#6797eb",
            stroke: null
          },
          new go.Binding("figure", "figure")),
        $(go.TextBlock, {
            font: "bold 11pt Helvetica, Arial, sans-serif",
            stroke: lightText,
            margin: 8,
            maxSize: new go.Size(160, NaN),
            wrap: go.TextBlock.WrapFit,
            editable: true,
            isMultiline: false
          },
          new go.Binding("text", "name").makeTwoWay())
      ),
      // four named ports, one on each side:
      makePort("T", go.Spot.Top, true, false),
      makePort("L", go.Spot.Left, true, true),
      makePort("R", go.Spot.Right, true, true),
      makePort("B", go.Spot.Bottom, false, true)
    ));

  myDiagram.nodeTemplateMap.add("BLOB", // the default category
    $(go.Node, "Spot", nodeStyle(),
      // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
      $(go.Panel, "Auto",
        $(go.Shape, "Ellipse", {
            name: "SHAPE",
            strokeWidth: 3,
            fill: "#f0e691",
            stroke: null
          },
          new go.Binding("figure", "figure")),
        $(go.TextBlock, {
            font: "bold 11pt Helvetica, Arial, sans-serif",
            stroke: lightText,
            margin: 8,
            maxSize: new go.Size(160, NaN),
            wrap: go.TextBlock.WrapFit,
            editable: true,
            isMultiline: false
          },
          new go.Binding("text", "name").makeTwoWay())
      ),
      // four named ports, one on each side:
      makePort("T", go.Spot.Top, true, false),
      makePort("L", go.Spot.Left, true, true),
      makePort("R", go.Spot.Right, true, true),
      makePort("B", go.Spot.Bottom, false, true)
    ));

  // replace the default Link template in the linkTemplateMap
  myDiagram.linkTemplate =
    $(go.Link, // the whole link panel
      {
        routing: go.Link.AvoidsNodes,
        curve: go.Link.JumpOver,
        corner: 5,
        toShortLength: 4,
        relinkableFrom: true,
        relinkableTo: true,
        reshapable: true
      },
      new go.Binding("points").makeTwoWay(),
      $(go.Shape, // the link path shape
        {
          isPanelMain: true,
          stroke: "gray",
          strokeWidth: 2
        }),
      $(go.Shape, // the arrowhead
        {
          toArrow: "standard",
          stroke: null,
          fill: "gray"
        }),
      $(go.Panel, "Auto", // the link label, normally not visible
        {
          visible: false,
          name: "LABEL",
          segmentIndex: 2,
          segmentFraction: 0.5
        },
        new go.Binding("visible", "visible").makeTwoWay(),
        $(go.Shape, "RoundedRectangle", // the label shape
          {
            fill: "#F8F8F8",
            stroke: null
          }),
        $(go.TextBlock, "Yes", // the label
          {
            textAlign: "center",
            font: "10pt helvetica, arial, sans-serif",
            stroke: "#333333",
            editable: true
          },
          new go.Binding("text", "text").makeTwoWay())
      )
    );

  // Make link labels visible if coming out of a "conditional" node.
  // This listener is called by the "LinkDrawn" and "LinkRelinked" DiagramEvents.
  function showLinkLabel(e) {
    var label = e.subject.findObject("LABEL");
    if (label !== null) label.visible = (e.subject.fromNode.data.figure ===
      "Diamond");
  }

  // temporary links used by LinkingTool and RelinkingTool are also orthogonal:
  myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
  myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;

  load(); // load an initial diagram from some JSON text
  var _model = document.getElementById("mySavedModel").value;
  _model = prettifyJSONString(_model);
  document.getElementById("mySavedModel").value = _model;

  // initialize the Palette that is on the left side of the page
  BlobPalette =
    $(go.Palette, "BLOB", // must name or refer to the DIV HTML element
      {
        "animationManager.duration": 800, // slightly longer than default (600ms) animation
        nodeTemplateMap: myDiagram.nodeTemplateMap, // share the templates used by myDiagram
        model: new go.GraphLinksModel([ // specify the contents of the Palette
          {
            category: "BLOB",
            name: "Blob",
            figure: "Ellipse"
          },
        ])
      });


  myPalette =
    $(go.Palette, "myPalette", // must name or refer to the DIV HTML element
      {
        "animationManager.duration": 800, // slightly longer than default (600ms) animation
        nodeTemplateMap: myDiagram.nodeTemplateMap, // share the templates used by myDiagram
        model: new go.GraphLinksModel([ // specify the contents of the Palette
          {
            name: "DATA",
            category: "DATA"
          }, {
            name: "RAW_DATA",
            category: "RAW_DATA"
          }, {
            name: "IMAGE_DATA",
            category: "IMAGE_DATA"
          }, {
            name: "DUMMY_DATA",
            category: "DUMMY_DATA"
          }, {
            name: "MEMORY_DATA",
            category: "MEMORY_DATA"
          }, {
            name: "PAIR_DATA",
            category: "PAIR_DATA"
          },
        ])
      });

  myPalette1 =
    $(go.Palette, "myPalette1", // must name or refer to the DIV HTML element
      {
        "animationManager.duration": 800, // slightly longer than default (600ms) animation
        nodeTemplateMap: myDiagram.nodeTemplateMap, // share the templates used by myDiagram
        model: new go.GraphLinksModel([ // specify the contents of the Palette
          {
            name: "CONVOLUTION",
            category: "CONVOLUTION"
          }, {
            name: "POOLING",
            category: "POOLING"
          }, {
            name: "SOFTMAX_LOSS",
            category: "SOFTMAX_LOSS"
          }, {
            name: "ACCURACY",
            category: "ACCURACY"
          }, {
            name: "RELU",
            category: "RELU"
          }, {
            name: "SIDMOID",
            category: "SIDMOID"
          }, {
            name: "DROPOUT",
            category: "DROPOUT"
          }, {
            name: "CONCAT",
            category: "CONCAT"
          }, {
            name: "BN",
            category: "BN"
          },
        ])
      });

}
