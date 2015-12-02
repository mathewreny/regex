// Mathew Reny
function MRegex(input, svgbind, stateRadius, transitionHeight) {
	var scale = transitionHeight;
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
			node.dims = { w: scale, h: scale + 7*node.text.length};
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
		this.svg.innerHTML = "";
		var totw = 0.0;
		var toth = 0.0;
		if (this.tree.dims.w > document.body.clientWidth) {
			toth = 4*radius + this.tree.dims.h;
			totw = this.tree.dims.w;
			this.tree.x = 0.0;
			this.tree.y = 2*radius;
		} else {
			toth = 4*radius + this.tree.dims.h;
			totw = document.body.clientWidth;
			this.tree.x = (document.body.clientWidth / 2.0) - (this.tree.dims.w / 2.0);
			this.tree.y = 2*radius;
		}
		this.svg.style.height = toth;
		this.svg.style.width = totw;
		

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
					continue;
				}

				switch (node.op) {
					case "c":
						// concat doesn't actually draw any states. Simply add the children to the queue.
						var cxh = node.x + (node.dims.w / 2.0);
						var cy = node.y;
						arrStates[node.start] = {x: cxh, y: cy};
						arrStates[node.finish] = {x: cxh, y: cy + node.dims.h};
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
						arrArrows[node.start].push({ finish: node.finish, arrow: "qleft", xedge: node.x + (scale / 2.0) });
						arrArrows[node.start].push({ finish: node.children[0].start, arrow: "qstart" });
						arrArrows[node.children[0].finish].push({ finish: node.finish, arrow: "qfinish" });
						// set the child x and y.
						node.children[0].x = node.x + (scale * 0.75);
						node.children[0].y = node.y + scale;
						break;
				}
				queue = queue.concat(node.children);
			}
		}


		var da = radius / 4.0;

		this.svg.innerHTML += "<defs>";
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
				var ss = arrStates[i];
				var sf = arrStates[a.finish];
				var pathid = "path" + i + "s" + a.finish + "f";
				switch (a.arrow) {
					case "t":
						this.svg.innerHTML += '<use xlink:href="#' + pathid + '" fill="none" stroke="black" stroke-width="1" />';
						var svgtext = '<text transform="translate('+da+')" text-anchor="middle" font-family="Courier New" font-size="12.0"><textPath startOffset="50%" xlink:href="#' + pathid + '">';
						this.svg.innerHTML += svgtext + a.text + '</textPath></text>';
						var tpath = "M"+sf.x+" "+(sf.y-radius)+" L"+(sf.x-da)+" "+(sf.y-radius-da)+" L"+(sf.x+da)+" "+(sf.y-radius-da);
						this.svg.innerHTML += '<path fill="black" d="'+tpath+'" />';
						break;
					case "unexpanded":
						this.svg.innerHTML += '<use xlink:href="#' + pathid + '" fill="none" stroke="black" stroke-width="1" />';
						var svgtext = '<text transform="translate('+da+')"  text-anchor="middle" font-family="Courier New" font-size="12.0"><textPath startOffset="50%" xlink:href="#' + pathid + '">';
						svgtext += '<a onclick="expandRegex(' + "'" + pathid + "'" + ');">' + a.text + '</a></textPath></text>';
						this.svg.innerHTML += svgtext;
						var tpath = "M"+sf.x+" "+(sf.y-radius)+" L"+(sf.x-da)+" "+(sf.y-radius-da)+" L"+(sf.x+da)+" "+(sf.y-radius-da);
						this.svg.innerHTML += '<path fill="black" d="'+tpath+'" />';
						break;
					case "qstart":
					case "pstart":
					case "utop":
						// gather required points for the bezier path. the points c(x|y)(f|b|s) correspond to final, cubic, and start.
						var cxf = sf.x;
						var cyf = ss.y + scale - radius;
						var cxb = cxf;
						var cyb = cyf - (scale / 2.0);
						var angle = Math.atan2(cyb-ss.y, cxb-ss.x);
						var cxs = ss.x + radius*Math.cos(angle);
						var cys = ss.y + radius*Math.sin(angle);
						// now create the bezier path svg element.
						var bpath = "M"+cxs+" "+cys+" Q"+cxb+" "+cyb+" "+cxf+" "+cyf+" L"+sf.x+" "+(sf.y-radius);
						this.svg.innerHTML += '<path fill="none" stroke="black" stroke-dasharray="'+da+","+da+'" stroke-width="1" d="'+bpath+'" />';
						var tpath = "M"+sf.x+" "+(sf.y-radius)+" L"+(sf.x-da)+" "+(sf.y-radius-da)+" L"+(sf.x+da)+" "+(sf.y-radius-da);
						this.svg.innerHTML += '<path fill="black" d="'+tpath+'" />';
						break;
					case "sfinish":
						var sfinpath = "M"+ss.x+" "+(ss.y+radius)+" L"+sf.x+" "+(sf.y-radius);
						this.svg.innerHTML += '<path stroke="black" stroke-width="1" stroke-dasharray="'+da+","+da+'" d="'+sfinpath+'" />';
						this.svg.innerHTML += '<path fill="black" d="M'+sf.x+" "+(sf.y-radius)+" L"+(sf.x-da)+" "+(sf.y-radius-da)+" L"+(sf.x+da)+" "+(sf.y-radius-da)+'" />';
						break;
					case "pfinish":
					case "qfinish":
					case "ubottom":
						// gather required points for the straight line segment.
						var sxs = ss.x;
						var sys = ss.y + radius;
						var sxf = sxs;
						var syf = sf.y + radius - scale;
						var cxb = sxs;
						var cyb = syf + (scale / 2.0);
						var angle = Math.atan2(cyb-sf.y, cxb-sf.x);
						var cxf = sf.x + radius*Math.cos(angle);
						var cyf = sf.y + radius*Math.sin(angle);
						var bpath = "M"+sxs+" "+sys+" L"+sxf+" "+syf+" Q"+cxb+" "+cyb+" "+cxf+" "+cyf;
						this.svg.innerHTML += '<path fill="none" stroke="black" stroke-dasharray="'+da+","+da+'" stroke-width="1" d="'+bpath+'" />';
						var dasin1 = da*Math.sin(angle-(Math.PI/4.0))*Math.sqrt(2);
						var dacos1 = da*Math.cos(angle-(Math.PI/4.0))*Math.sqrt(2);
						var dasin2 = da*Math.sin(angle+(Math.PI/4.0))*Math.sqrt(2);
						var dacos2 = da*Math.cos(angle+(Math.PI/4.0))*Math.sqrt(2);
						var tpath = "M"+cxf+" "+(cyf)+" L"+(cxf+dacos1)+" "+(cyf+dasin1)+" L"+(cxf+dacos2)+" "+(cyf+dasin2);
						this.svg.innerHTML += '<path fill="black" d="'+tpath+'" />';
						break;
					case "qleft":
					case "sleft":
						var sxs = a.xedge;
						var sys = ss.y + scale;
						var syf = sf.y - scale;
						var cy1b = sys - (scale / 2.0);
						var cy2b = syf + (scale / 2.0);
						var angle1 = Math.atan2(cy1b-ss.y, sxs-ss.x);
						var angle2 = Math.atan2(cy2b-sf.y, sxs-sf.x);
						var cxs = ss.x + radius*Math.cos(angle1);
						var cxf = sf.x + radius*Math.cos(angle2);
						var cys = ss.y + radius*Math.sin(angle1);
						var cyf = sf.y + radius*Math.sin(angle2);
						var bpath = "M"+cxs+" "+cys+" Q"+sxs+" "+cy1b+" "+sxs+" "+sys+" L"+sxs+" "+syf+" Q"+sxs+" "+cy2b+" "+cxf+" "+cyf;
						this.svg.innerHTML += '<path fill="none" stroke="black" stroke-dasharray="'+da+","+da+'" stroke-width="1" d="'+bpath+'" />';
						var dasin1 = da*Math.sin(angle2-(Math.PI/4.0))*Math.sqrt(2);
						var dacos1 = da*Math.cos(angle2-(Math.PI/4.0))*Math.sqrt(2);
						var dasin2 = da*Math.sin(angle2+(Math.PI/4.0))*Math.sqrt(2);
						var dacos2 = da*Math.cos(angle2+(Math.PI/4.0))*Math.sqrt(2);
						var tpath = "M"+cxf+" "+cyf+" L"+(cxf+dacos1)+" "+(cyf+dasin1)+" L"+(cxf+dacos2)+" "+(cyf+dasin2);
						this.svg.innerHTML += '<path fill="black" d="'+tpath+'" />';
						break;
					case "pright":
						// create a cubic bezier curve.
						var p1x = sf.x + radius*0.7071067811865476;
						var p1y = sf.y - radius*0.7071067811865476;
						var p2x = a.xedge;
						var p2y = sf.y;
						var b1x = p1x + (scale - (2*radius))*0.7071067811865476;
						var b2x = p2x;
						var b1y = p1y - (scale - (2*radius))*0.7071067811865476;
						var b2y = b1y;
						var bpath = "M"+p1x+" "+p1y+" C"+b1x+" "+b1y+" "+b2x+" "+b2y+" "+p2x+" "+p2y;
						// draw the straight line.
						bpath += " L"+p2x+" "+(ss.y - scale);
						// draw the final bezier curve.
						var cxb = p2x;
						var cyb = ss.y - (scale / 2.0);
						var angle = Math.atan2(cyb-ss.y, cxb-ss.x);
						var cxf = ss.x + radius*Math.cos(angle);
						var cyf = ss.y + radius*Math.sin(angle);
						bpath += " Q"+cxb+" "+cyb+" "+cxf+" "+cyf;
						this.svg.innerHTML += '<path fill="none" stroke="black" stroke-dasharray="'+da+','+da+'" stroke-width="1" d="'+bpath+'" />';
						var daside = da*1.4142135623730951;
						var tpath = "M"+p1x+" "+p1y+" L"+(p1x+daside)+" "+p1y+" L"+p1x+" "+(p1y-daside);
						this.svg.innerHTML += '<path fill="black" d="'+tpath+'" />';
						break;
					case "sright":
						// create a cubic bezier curve.
						var p1x = sf.x;
						var p2x = a.xedge;
						var p1y = sf.y - radius;
						var p2y = p1y;
						var b1x = p1x;
						var b2x = p2x;
						var b1y = p1y - scale + (2*radius);
						var b2y = b1y;
						var bpath = "M"+p1x+" "+p1y+" C"+b1x+" "+b1y+" "+b2x+" "+b2y+" "+p2x+" "+p2y;
						// draw the straight line.
						bpath += " L"+p2x+" "+(ss.y - scale);
						// draw the final bezier curve.
						var cxb = p2x;
						var cyb = ss.y - (scale / 2.0);
						var angle = Math.atan2(cyb-ss.y, cxb-ss.x);
						var cxf = ss.x + radius*Math.cos(angle);
						var cyf = ss.y + radius*Math.sin(angle);
						bpath += " Q"+cxb+" "+cyb+" "+cxf+" "+cyf;
						this.svg.innerHTML += '<path fill="none" stroke="black" stroke-dasharray="'+da+','+da+'" stroke-width="1" d="'+bpath+'" />';
						this.svg.innerHTML += '<path fill="black" d="M'+sf.x+" "+(sf.y-radius)+" L"+(sf.x-da)+" "+(sf.y-radius-da)+" L"+(sf.x+da)+" "+(sf.y-radius-da)+'" />';
						break;



				}
			}
		}

		// add start state and put the double circle in the finish state.
		this.svg.innerHTML += '<path stroke="black" stroke-width="1" d="M'+(totw/2.0)+" 0.1 L"+(totw/2.0)+" "+radius+'" />';
		this.svg.innerHTML += '<path fill="black" d="M'+(totw/2.0)+" "+radius+" L"+((totw/2.0)-da)+" "+(radius-da)+" L"+((totw/2.0)+da)+" "+(radius-da)+'" />';
		this.svg.innerHTML += '<circle r="'+(radius-da)+'" cx="'+(totw/2.0)+'" cy="'+(toth - (2*radius))+'" fill="none" stroke="black" stroke-width="1" />';
		
		
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
					w = node.children[0].dims.w + (scale / 2.0);
					break;
				case "q":
					h = node.children[0].dims.h + 2*scale;
					w = node.children[0].dims.w + (scale / 2.0);
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

