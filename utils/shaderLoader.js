function createShader(str, type) {
	//create a new shader of that type
	var shader = gl.createShader(type);

	//load the code into gl
	gl.shaderSource(shader, str);

	//compile the shaders code
	gl.compileShader(shader);

	//Do nothing if shader compiled correct
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw gl.getShaderInfoLog(shader);
	}

	return shader;
}

function linkProgram(program) {
	//create both shaders with their text and typ
	var vshader = createShader(program.vshaderSource, gl.VERTEX_SHADER);
	var fshader = createShader(program.fshaderSource, gl.FRAGMENT_SHADER);

	//attach the shaders to the program
	gl.attachShader(program, vshader);
	gl.attachShader(program, fshader);

	//link the program
	gl.linkProgram(program);

	//if program is linked correctly do nothing else
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw gl.getProgramInfoLog(program);
	}
}

function loadFile(file, callback, noCache, isJson) {
    //build the request
    var request = new XMLHttpRequest();

	//State handler
	request.onreadystatechange = function() {
		if (request.readyState == 1) {
			if (isJson) {
				request.overrideMimeType('application/json');
			}
			request.send();
		} else if (request.readyState == 4) {
			if (request.status == 200) {
				//request complete (successfull)
				callback(request.responseText);
			} else if (request.status == 404) {
				//request complete (error)
				throw 'File "' + file + '" does not exist.';
			} else {
				//request complete (error)
				throw 'XHR error ' + request.status + '.';
			}
		}
	};

	//Add the current time so the files do not get cached
	var url = file;
	if (noCache) {
		url += '?' + (new Date()).getTime();
	}

	//start the request
	request.open('GET', url, true);
}

function loadProgram(vs, fs, callback, amount) {
    //Set path to shaders-folders
    vs = "shaders/vertex/" + vs;
    fs = "shaders/fragment/" + fs;

    //create the program to be filled
	var program = gl.createProgram();

    //fill the program with loaded part and call callback if finished
    function vshaderLoaded(str) {
		program.vshaderSource = str;
		if (program.fshaderSource) {
			linkProgram(program);
			callback(program, amount);
		}
	}
	function fshaderLoaded(str) {
		program.fshaderSource = str;
		if (program.vshaderSource) {
			linkProgram(program);
			callback(program, amount);
		}
	}

    //start loading the shaders
	loadFile(vs, vshaderLoaded, true);
	loadFile(fs, fshaderLoaded, true);

	return program;
}
