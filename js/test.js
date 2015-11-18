function doc2str(fn) {
    return fn.toString().split('\n').slice(1,-1).join('\n') + '\n'
}

function load_test_net(filename) {
	$.getScript("./data_for_test/"+filename, function() {
	  document.getElementById("prototxt").value = prototxt_content;
	  gen_model();
	});
}