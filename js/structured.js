function doc2str(fn) {
    return fn.toString().split('\n').slice(1,-1).join('\n') + '\n'
}


var CONV_PATTERN = "conv";
var INCEPTION_BN_TEMPLATE = doc2str(function(){/*
layer {
  name: "ic#%#NAME#%#/1x1"
  type: "ConvolutionData"
  bottom: "#%#BOTTOM#%#"
  top: "ic#%#NAME#%#/1x1"
  param {
    lr_mult: 1
    decay_mult: 1
  }
  param {
    lr_mult: 2
    decay_mult: 0
  }
  convolution_param {
    num_output: #%#CHANNEL1#%#
    kernel_size: 1
    weight_filler {
      type: "xavier"
    }
    bias_filler {
      type: "constant"
      value: 0.2
    }
  }
}
layer {
  name : "ic#%#NAME#%#/1x1_bn"
  type : "BNData"
  bottom : "ic#%#NAME#%#/1x1"
  top : "ic#%#NAME#%#/1x1_bn"
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 0
  }
  param {
    lr_mult : 0
  }
  bn_param {
    scale_filler {
      type : "constant"
      value : 1
    }
    shift_filler {
      type : "constant"
    }
    moving_average : true
    decay : 0.05
  }
}
layer {
  name: "ic#%#NAME#%#/relu_1x1"
  type: "ReLU"
  bottom: "ic#%#NAME#%#/1x1_bn"
  top: "ic#%#NAME#%#/1x1_bn"
}
layer {
  name: "ic#%#NAME#%#/3x3"
  type: "ConvolutionData"
  bottom: "#%#BOTTOM#%#"
  top: "ic#%#NAME#%#/3x3"
  param {
    lr_mult: 1
    decay_mult: 1
  }
  param {
    lr_mult: 2
    decay_mult: 0
  }
  convolution_param {
    num_output: #%#CHANNEL2#%#
    pad: 1
    kernel_size: 3
    weight_filler {
      type: "xavier"
    }
    bias_filler {
      type: "constant"
      value: 0.2
    }
  }
}
layer {
  name : "ic#%#NAME#%#/3x3_bn"
  type : "BNData"
  bottom : "ic#%#NAME#%#/3x3"
  top : "ic#%#NAME#%#/3x3_bn"
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 0
  }
  param {
    lr_mult : 0
  }
  bn_param {
    scale_filler {
      type : "constant"
      value : 1
    }
    shift_filler {
      type : "constant"
    }
    moving_average : true
    decay : 0.05
  }
}
layer {
  name: "ic#%#NAME#%#/relu_3x3"
  type: "ReLU"
  bottom: "ic#%#NAME#%#/3x3_bn"
  top: "ic#%#NAME#%#/3x3_bn"
}

layer {
  name: "ic#%#NAME#%#/3x3_reduce"
  type: "ConvolutionData"
  bottom: "#%#BOTTOM#%#"
  top: "ic#%#NAME#%#/3x3_reduce"
  param {
    lr_mult: 1
    decay_mult: 1
  }
  param {
    lr_mult: 2
    decay_mult: 0
  }
  convolution_param {
    num_output: #%#CHANNEL3#%#
    pad: 1
    kernel_size: 3
    weight_filler {
      type: "xavier"
    }
    bias_filler {
      type: "constant"
      value: 0.2
    }
  }
}
layer {
  name : "ic#%#NAME#%#/3x3_reduce_bn"
  type : "BNData"
  bottom : "ic#%#NAME#%#/3x3_reduce"
  top : "ic#%#NAME#%#/3x3_reduce_bn"
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 0
  }
  param {
    lr_mult : 0
  }
  bn_param {
    scale_filler {
      type : "constant"
      value : 1
    }
    shift_filler {
      type : "constant"
    }
    moving_average : true
    decay : 0.05
  }
}

layer {
  name: "ic#%#NAME#%#/relu_3x3_reduce"
  type: "ReLU"
  bottom: "ic#%#NAME#%#/3x3_reduce_bn"
  top: "ic#%#NAME#%#/3x3_reduce_bn"
}
layer {
  name: "ic#%#NAME#%#/3x3_stack"
  type: "ConvolutionData"
  bottom: "ic#%#NAME#%#/3x3_reduce_bn"
  top: "ic#%#NAME#%#/3x3_stack"
  param {
    lr_mult: 1
    decay_mult: 1
  }
  param {
    lr_mult: 2
    decay_mult: 0
  }
  convolution_param {
    num_output: #%#CHANNEL3#%#
    pad: 1
    kernel_size: 3
    weight_filler {
      type: "xavier"
    }
    bias_filler {
      type: "constant"
      value: 0.2
    }
  }
}
layer {
  name : "ic#%#NAME#%#/3x3_stack_bn"
  type : "BNData"
  bottom : "ic#%#NAME#%#/3x3_stack"
  top : "ic#%#NAME#%#/3x3_stack_bn"
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 0
  }
  param {
    lr_mult : 0
  }
  bn_param {
    scale_filler {
      type : "constant"
      value : 1
    }
    shift_filler {
      type : "constant"
    }
    moving_average : true
    decay : 0.05
  }
}

layer {
  name: "ic#%#NAME#%#/relu_3x3_stack"
  type: "ReLU"
  bottom: "ic#%#NAME#%#/3x3_stack_bn"
  top: "ic#%#NAME#%#/3x3_stack_bn"
}
layer {
  name: "ic#%#NAME#%#/pool"
  type: "Pooling"
  bottom: "#%#BOTTOM#%#"
  top: "ic#%#NAME#%#/pool"
  pooling_param {
    pool: AVE
    kernel_size: 3
    stride: 1
    pad: 1
  }
}
layer {
  name: "ic#%#NAME#%#/pool_proj"
  type: "ConvolutionData"
  bottom: "ic#%#NAME#%#/pool"
  top: "ic#%#NAME#%#/pool_proj"
  param {
    lr_mult: 1
    decay_mult: 1
  }
  param {
    lr_mult: 2
    decay_mult: 0
  }
  convolution_param {
    num_output: #%#CHANNEL4#%#
    pad: 1
    kernel_size: 3
    weight_filler {
      type: "xavier"
    }
    bias_filler {
      type: "constant"
      value: 0.2
    }
  }
}
layer {
  name : "ic#%#NAME#%#/pool_proj_bn"
  type : "BNData"
  bottom : "ic#%#NAME#%#/pool_proj"
  top : "ic#%#NAME#%#/pool_proj_bn"
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 1
  }
  param {
    lr_mult : 0
  }
  param {
    lr_mult : 0
  }
  bn_param {
    scale_filler {
      type : "constant"
      value : 1
    }
    shift_filler {
      type : "constant"
    }
    moving_average : true
    decay : 0.05
  }
}

layer {
  name: "ic#%#NAME#%#/relu_pool_proj"
  type: "ReLU"
  bottom: "ic#%#NAME#%#/pool_proj_bn"
  top: "ic#%#NAME#%#/pool_proj_bn"
}
layer {
  name: "output_ic#%#NAME#%#"
  type: "Concat"
  bottom: "ic#%#NAME#%#/1x1_bn"
  bottom: "ic#%#NAME#%#/3x3_bn"
  bottom: "ic#%#NAME#%#/3x3_stack_bn"
  bottom: "ic#%#NAME#%#/pool_proj_bn"
  top: "output_ic#%#NAME#%#"
}

*/});

var CONV_LAYER_TEMPLATE = doc2str(function(){/*
layer {
  name: "conv#%#NAME#%#"
  type: "ConvolutionData"
  bottom: "#%#BOTTOM#%#"
  top: "conv#%#NAME#%#"
  convolution_param {
    num_output: #%#CHANNELS#%#
    pad: 1
    kernel_size: 3
    stride: 1
    weight_filler {
      type: "msra"
      variance_norm: FAN_OUT
    }
    bias_filler {
      type: "constant"
      value: 0.0
    }
  }
}
layer {
  name: "prelu#%#NAME#%#"
  type: "PReLU"
  bottom: "conv#%#NAME#%#"
  top: "prelu#%#NAME#%#"
}

*/});

var STAGE_SPLIT_TEMPLATE = doc2str(function(){/*
layer {
  name: "pool#%#NAME#%#"
  type: "Pooling"
  bottom: "#%#BOTTOM#%#"
  top: "pool#%#NAME#%#"
  pooling_param {
    pool: #%#POOLMETHOD#%#
    kernel_size: 2
    stride: 2
  }  
}

*/});

var DATA_LAYER_TEMPLATE = doc2str(function(){/*'
name: "net"
layer {
  name : "image_input"
  type : "ImageData"
  top : "data"
  top : "label"
  image_data_param {
    source: "train.txt"
    batch_size : 256
    is_color : 1
  }
  include {
    phase: TRAIN  
  }
}
layer {
  name : "image_input"
  type : "ImageData"
  top : "data"
  top : "label"
  image_data_param {
    source: "test.txt"
    batch_size : 64
    is_color: 1
  }
  include {
    phase: TEST  
  }
}

'*/});

var LOSS_LAYER_TEMPLATE = doc2str(function(){/*'
layer {
  name : "local4_data1"
  type : "InnerProduct"
  bottom : "#%#BOTTOM#%#"
  top : "local4_data1"
  param {
    lr_mult : 1
    decay_mult : 1
  }
  param {
    lr_mult : 1
    decay_mult : 1
  }
  inner_product_param {
    num_output : 64
    weight_filler {
      type : "gaussian"
      std : 0.001
    }
    bias_filler {
      type : "constant"
    }
  }
}
layer {
  name : "Relu2"
  type : "ReLU"
  bottom : "local4_data1"
  top : "output"
}
layer {
  name : "Dropout1"
  type : "Dropout"
  bottom : "output"
  top: "output"
  dropout_param {
    dropout_ratio: 0.2
  }
}
layer {
  name: "loss_layer_2"
  type: "SoftmaxWithLoss"
  bottom: "output"
  bottom: "label"
  top: "loss"
}

'*/});

function get_common_template(type) {
  switch(type) {
    case 'conv':
      return {
        "template": CONV_LAYER_TEMPLATE,
        "name": "conv",
        "output": "prelu"
      };
    case 'inception_bn':
      return {
        "template": INCEPTION_BN_TEMPLATE,
        "name": "ic",
        "output": "output_ic"
      };
    default:
      return '';
  }
}

function gen_structured_network() {
	var _network = '';
	var _data_layer = '';
	var _common_layer = '';
	var _loss_layer = '';
  var _type = ''
  var _stage = {};
  var _idx, _count, _name, _num_output, _length;
  var _bottom, _top, _channel;
  var i, j;

  var _stages_from_ui = document.getElementById('stages').value;
  var _filters_from_ui = document.getElementById('filters').value;

  if (isNaN(_stages_from_ui) || !_stages_from_ui) {
    showErrorToast('Please fill the stages with posititve number!');
    return;
  }

  var _filters_each_stage = _filters_from_ui.split(';');

  for (i=0; i < _stages_from_ui; ++i) {
    _stage[i] = _filters_each_stage[i].split(",");
    for (j=0; j < _stage[i].length; ++j) {
      _stage[i][j] = parseInt(_stage[i][j]);
    }
  }

  _type = 'inception_bn';
  _type = 'conv'

  _pool_method = 'MAX'
  //_pool_method = 'AVE'

  var _stat = get_common_template(_type);
  var _common_template = _stat["template"];
  var _name_pattern = _stat["name"];
  var _output_pattern = _stat["output"];

	_data_layer = DATA_LAYER_TEMPLATE;

  _bottom = "data"
  for(_idx in _stage) {
    _length = _stage[_idx].length;
    for(_count = 1; _count <= _length; ++_count) {
      _name = '' + _idx + _count;
      _channel = _stage[_idx][_count-1];
      _tmp_str = _common_template.replace(/#%#BOTTOM#%#/g, _bottom);
      _tmp_str = _tmp_str.replace(/#%#NAME#%#/g, _name);
      if (_type == 'conv') {
        _tmp_str = _tmp_str.replace(/#%#CHANNELS#%#/g, _channel);
      } else if (_type == 'inception_bn') {
        _tmp_str = _tmp_str.replace(/#%#CHANNEL1#%#/g, _channel/8);
        _tmp_str = _tmp_str.replace(/#%#CHANNEL2#%#/g, _channel/4);
        _tmp_str = _tmp_str.replace(/#%#CHANNEL3#%#/g, _channel/2);
        _tmp_str = _tmp_str.replace(/#%#CHANNEL4#%#/g, _channel/8);
      }
      _common_layer += _tmp_str;
      _bottom = _output_pattern+_name;
    }
    _tmp_str = STAGE_SPLIT_TEMPLATE.replace(/#%#BOTTOM#%#/g, _output_pattern+_name);
    _tmp_str = _tmp_str.replace(/#%#POOLMETHOD#%#/g, _pool_method)
    _bottom = "pool"+_name;
    _common_layer += _tmp_str.replace(/#%#NAME#%#/g, _name)
  }

  _loss_layer = LOSS_LAYER_TEMPLATE.replace("#%#BOTTOM#%#", _bottom);
  _network = _data_layer+_common_layer+_loss_layer;

	document.getElementById("prototxt").value = _network;
    editor_proto.setValue(document.getElementById("prototxt").value);
}