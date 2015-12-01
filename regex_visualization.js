// Mathew Reny
function MRegex(input, svgbind, stateRadius, transitionHeight) {
	var phi = 1.6180339887;
	var scale = (transitionHeight / phi);
	var radius = stateRadius;

	this.input = input;
	this.tree = parser.parse(input);
	this.svg = svgbind;

	// fill the tree with state numbers.
	var queue = [this.tree];
	var states = 0;
	while (0 != queue.length) {
		var qlength = queue.length;
		for (var i = 0; i < qlength; i++) {
			var node = queue.shift();
			if ("undefined" === typeof node.start) {
				states++;
				node.start = states;
			}
			if ("undefined" === typeof node.finish) {
				states++;
				node.finish = states;
			}
			if ("t" === node.op) {
				continue;
			} else if ("c" === node.op) {
				for (var j = 1; j < node.children.length; j++) {
					states++;
					node.children[j-1].finish = states;
					node.children[j].start = states;
				}
				//node.children[0].start = node.start;
				//node.children[node.children.length - 1].finish = node.finish;
			}
			queue = queue.concat(node.children);
		}
	}
	
	// The total number of states.
	this.states = states;

	// fill the tree with placeholder dimensions.
	queue = [ this.tree ];
	while (0 != queue.length) {
		var qlength = queue.length;
		for (var i = 0; i < qlength; i++) {
			var node = queue.shift();
			node.dims = { w: scale, h: scale*phi };
			if ("t" === node.op) {
				continue;
			}
			queue = queue.concat(node.children);
		}
	}

	// fill the tree with a link to the parent.
	queue = [ this.tree ];
	while (0 != queue.length) {
		var qlength = queue.length;
		for (var i = 0; i < qlength; i++) {
			var node = queue.shift();
			if ("t" === node.op) {
				continue;
			}
			for (var j = 0; j < node.children.length; j++) {
				node.children[j].parent = node;
			}
			queue = queue.concat(node.children);
		}
	}


	this.render = function() {

		if (this.tree.dims.w > document.body.clientWidth) {
			this.svg.style.height = 4*radius + this.tree.dims.h;
			this.svg.style.width = this.tree.dims.w;
			this.tree.x = 0.0;
			this.tree.y = 2*radius;
		} else {
			this.svg.style.height = 4*radius + this.tree.dims.h;
			this.svg.style.width = document.body.clientWidth;
			this.tree.x = (document.body.clientWidth / 2.0) - (this.tree.dims.w / 2.0);
			this.tree.y = 2*radius;
		}

		var arrStates = new Array(this.states + 1);
		var arrArrows = new Array(this.states + 1);
		for (var i = 0; i < this.states + 1; i++) {
			arrArrows[i] = new Array();
		}

		var queue = [ this.tree ];
		while (0 != queue.length) {
			for (var q = queue.length; q != 0; q--) {
				var node = queue.shift();

				if (!node.expanded || "t" === node.op) {
					var x = node.x + (node.dims.w / 2.0);
					arrStates[node.start] = {x: x, y: node.y };
					arrStates[node.finish] = {x: x, y: node.y + node.dims.h };
					var arrow = node.expanded ? "t" : "unexpanded";
					arrArrows[node.start].push({ finish: node.finish, arrow: arrow, text: node.text, node: node});

					console.log( arrStates[node.start] );
					console.log( arrStates[node.finish] );
					continue;
				}

				switch (node.op) {
					case "c":
						// concat doesn't actually draw any states. Simply add the children to the queue.
						var cxh = node.x + (node.dims.w / 2.0);
						var cy = node.y;
						for (var i = 0; i < node.children.length; i++) {
							node.children[i].x = cxh - (node.children[i].dims.w / 2.0);
							node.children[i].y = cy;
							cy += node.children[i].dims.h;
						}
						break;
					case "u":
						// add the start and finish states.
						arrStates[node.start] = {x: node.x + (node.dims.w / 2.0), y: node.y};
						arrStates[node.finish] = {x: node.x + (node.dims.w / 2.0), y: node.y + node.dims.h};
			
						// set the child node's x and y. Also add arrows to the children.
						var uyh = node.y + (node.dims.h / 2.0);
						var ux = node.x;
						for (var i = 0; i < node.children.length; i++) {
							node.children[i].x = ux;
							ux += node.children[i].dims.w;
							node.children[i].y = uyh - (node.children[i].dims.h / 2.0);
							arrArrows[node.start].push({ finish: node.children[i].start, arrow: "utop" });
							arrArrows[node.children[i].finish].push({ finish: node.finish, arrow: "ubottom" });
						}
						break;
					case "s":
						// add the start and finish states.
						arrStates[node.start] = {x: node.x + (node.dims.w / 2.0), y: node.y};
						arrStates[node.finish] = {x: node.x + (node.dims.w / 2.0), y: node.y + node.dims.h};
						// add the arrows.
						arrArrows[node.start].push({ finish: node.finish, arrow: "sleft", xedge: node.x + (scale / 3.0) });
						var rxedge = node.x + node.dims.w - (scale / 3.0);
						arrArrows[node.finish].push({ finish: node.children[0].start, arrow: "sright", xedge: rxedge });
						arrArrows[node.children[0].finish].push({ finish: node.finish, arrow: "sfinish" });
						// set the child x and y.
						node.children[0].x = node.x + (scale / 2.0);
						node.children[0].y = node.y + scale;
						break;
					case "p":
						// add the start and finish states.
						arrStates[node.start] = {x: node.x + (node.dims.w / 2.0), y: node.y};
						arrStates[node.finish] = {x: node.x + (node.dims.w / 2.0), y: node.y + node.dims.h};
						// add the arrows.
						arrArrows[node.start].push({ finish: node.children[0].start, arrow: "pstart" });
						var rxedge = node.x + node.dims.w - (scale / 3.0);
						arrArrows[node.finish].push({ finish: node.children[0].start, arrow: "pright", xedge: rxedge });
						arrArrows[node.children[0].finish].push({ finish: node.finish, arrow: "pfinish" });
						// set the child x and y.
						node.children[0].x = node.x;
						node.children[0].y = node.y + scale;
						break;
					case "q":
						// add the start and finish states.
						arrStates[node.start] = {x: node.x + (node.dims.w / 2.0), y: node.y};
						arrStates[node.finish] = {x: node.x + (node.dims.w / 2.0), y: node.y + node.dims.h};
						// add the arrows.
						arrArrows[node.start].push({ finish: node.finish, arrow: "qleft", xedge: node.x + (scale / 3.0) });
						arrArrows[node.start].push({ finish: node.children[0].start, arrow: "qstart" });
						arrArrows[node.children[0].finish].push({ finish: node.finish, arrow: "qfinish" });
						// set the child x and y.
						node.children[0].x = node.x + (scale / 2.0);
						node.children[0].y = node.y + scale;
						break;
				}
				queue = queue.concat(node.children);
			}
		}




		this.svg.innerHTML = "<defs>";
		for (var i = 1; i < this.states+1; i++) {
			for (var j = 0; j < arrArrows[i].length; j++) {
				var a = arrArrows[i][j];
				
				switch (a.arrow) {
					case "unexpanded":
					case "t":
						var path = "M" + arrStates[i].x + " " + (arrStates[i].y + radius);
						path += " L" + arrStates[a.finish].x + " " + (arrStates[a.finish].y - radius);
						this.svg.innerHTML += '<path d="' + path + '" id="path' + i + 's' + a.finish + 'f"/>';
						break;
				}
			}
		}
		this.svg.innerHTML += "</defs>";

		var circlefinish = '" r="' + radius + '" stroke="black" stroke-width="1" fill="white" />';
		for (var i = 1; i < this.states+1; i++) {
			if (typeof arrStates[i] === "undefined") {
				continue;
			}
			var state = arrStates[i];
			this.svg.innerHTML += '<circle cx="' + state.x + '" cy="' + state.y + circlefinish;
		}

		for (var i = 1; i < this.states + 1; i++) {
			for (var j = 0; j < arrArrows[i].length; j++) {
				var a = arrArrows[i][j];
				var pathid = "path" + i + "s" + a.finish + "f";
				switch (a.arrow) {
					case "t":
						this.svg.innerHTML += '<use xlink:href="#' + pathid + '" fill="none" stroke="black" stroke-width="1" />';
						var svgtext = '<text text-anchor="middle" font-family="Verdana" font-size="12.0"><textPath startOffset="50%" xlink:href="#' + pathid + '">';
						this.svg.innerHTML += svgtext + a.text + '</textPath></text>';
						break;
					case "unexpanded":
						var svgtext = '<text text-anchor="middle" font-family="Verdana" font-size="12.0"><textPath startOffset="50%" xlink:href="#' + pathid + '">';
						svgtext += '<a onclick="expandRegex(' + "'" + pathid + "'" + ');">' + a.text + '</a></textPath></text>';
						this.svg.innerHTML += svgtext;
						break;
				}
			}
		}

		for (var i = 1; i < this.states + 1; i++) {
			for (var j = 0; j < arrArrows[i].length; j++) {
				var a = arrArrows[i][j];
				if ("unexpanded" === a.arrow) {
					document.getElementById("path" + i + "s" + a.finish + "f").node = a.node;
				}
			}
		}

	}

	
	// Call this function to expand a regular expression svg.
	this.expand = function(n) {
		var node = n;
		node.expanded = true;
		while ("undefined" !== typeof node) {
			var h = 0;
			var w = 0;
			switch (node.op) {
				case "t":
					h = phi*scale;
					w = scale;
					break;
				case "c":
					for (var i = 0; i < node.children.length; i++) {
						if (node.children[i].dims.w > w) {
							w = node.children[i].dims.w;
						}
						h += node.children[i].dims.h;
					}
					break;
				case "u":
					for (var i = 0; i < node.children.length; i++) {
						w += node.children[i].dims.w;
						if (node.children[i].dims.h + 2*scale > h) {
							h = node.children[i].dims.h + 2*scale;
						}
					}
					break;
				case "s":
					h = node.children[0].dims.h + 2*scale;
					w = node.children[0].dims.w + scale;
					break;
				case "p":
					h = node.children[0].dims.h + 2*scale;
					w = node.children[0].dims.w + scale;
					break;
				case "q":
					h = node.children[0].dims.h + 2*scale;
					w = node.children[0].dims.w + scale;
					break;
			}
			node.dims = { w: w, h: h };
			node = node.parent;
		}
	}	
}

function expandRegex(id) {
	regexobj.expand(document.getElementById(id).node);
	regexobj.render();
}

