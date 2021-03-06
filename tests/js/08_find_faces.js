var test08 = function(p) {
	p.mouseMovedCallback = undefined;
	// var WIDTH = this.canvas.parentElement.offsetWidth;
	// var HEIGHT = this.canvas.parentElement.offsetHeight;
	var paperSize = 250;
	var WIDTH = paperSize;
	var HEIGHT = paperSize;
	// myp5.canvas.parentElement.offsetWidth

	var g = new CreasePattern();
	var closestEdge = undefined;
	p.scalar = 1.0;

	// g.generateFacesInProgress = function(){
	// 	var allNodesClockwise = [];
	// 	for(var i = 0; i < this.nodes.length; i++){
	// 			getClockwiseNeighborAround(node, fromNode){

	// 		var sortedNodes = this.getClockwiseConnectedNodesSorted(i);
	// 		if(sortedNodes == undefined) sortedNodes = [];
	// 		allNodesClockwise.push(sortedNodes);
	// 	}
	// 	// walk around a face
	// 	this.faces = [];
	// 	var i = 0;
	// 	for(var i = 0; i < this.nodes.length; i++){
	// 		for(var n = 0; n < allNodesClockwise[i].length; n++){
	// 			var aFace = [ i ];
	// 			var iterate = 0;
	// 			var current = allNodesClockwise[i][n];
	// 			var previous = i;
	// 			while(iterate < 100 && i != current){
	// 				aFace.push(current);
	// 				var previousBackup = previous;
	// 				previous = current;
	// 				current = this.getNextElementToItemInArray( allNodesClockwise[ current ], previousBackup );
	// 				if(current == undefined) iterate = 100;
	// 				if(aFace.length > 4) iterate = 100;
	// 				iterate++;
	// 			}
	// 			if(iterate < 99){
	// 				this.faces.push( aFace );
	// 			}
	// 		}
	// 	}
	// }

	function reset(){
		g.clear();
		g.birdBase();
		g.generateFaces();
	}

	p.setup = function(){
		canvas = p.createCanvas(WIDTH, HEIGHT);
		p.strokeWeight(.01);
		reset();
	}

	p.draw = function() {
		p.scalar = 0.5+0.5*Math.sin(p.millis() / 1000.0) - .01;
		if(p.scalar < 0) p.scalar = 0.0;
		p.clear();
		p.applyMatrix(paperSize, 0, 0, paperSize, WIDTH*0.5-paperSize*0.5, HEIGHT*0.5-paperSize*0.5);		
		p.fill(0, 0, 0);
		p.stroke(0, 0, 0);
		drawCoordinateFrame(p);
		drawGraphPoints(p, g);
		drawGraphLines(p, g);
		for(var i = 0; i < g.faces.length * p.scalar; i++){
			var color = HSVtoRGB(i/g.faces.length, 1.0, 1.0);
			p.fill(color.r, color.g, color.b, 50);
			p.beginShape();
			var faceNodes = g.faces[i].nodes;
			for(f = 0; f < faceNodes.length; f++){
				p.vertex(faceNodes[f].x, faceNodes[f].y);
			}
			p.endShape();
		}
		if(closestEdge != undefined){
			p.stroke(255, 0, 0);
			p.fill(255, 0, 0);
			p.line(   g.nodes[ g.edges[closestEdge].a ].x, g.nodes[ g.edges[closestEdge].a ].y, 
			          g.nodes[ g.edges[closestEdge].b ].x, g.nodes[ g.edges[closestEdge].b ].y );
			p.ellipse(g.nodes[ g.edges[closestEdge].a ].x, g.nodes[ g.edges[closestEdge].a ].y, .01, .01);
			p.ellipse(g.nodes[ g.edges[closestEdge].b ].x, g.nodes[ g.edges[closestEdge].b ].y, .01, .01);
		}
	}
};