var p5_nearest_node = function(p) {
	p.callback = undefined;
	p.numPoints = 50;
	// var WIDTH = window.innerWidth;
	// var HEIGHT = window.innerHeight;
	var paperSize = 250;
	var WIDTH = paperSize;
	var HEIGHT = paperSize;

	var g = new PlanarGraph();
	var closestNode = undefined;
	var closestNodes = [];

	var mouseXScaled;
	var mouseYScaled;

	function reset(){
		g.clear();
		for(var i = 0 ;i  < p.numPoints; i++){
			g.newNode().position(Math.random(), Math.random());
		}
		closestNode = undefined;
		closestNodes = [];
	}

	p.setup = function(){
		canvas = p.createCanvas(WIDTH, HEIGHT);
		p.strokeWeight(.01);
		reset();
	}

	p.draw = function() {
		p.clear();
		p.applyMatrix(paperSize, 0, 0, paperSize, WIDTH*0.5-paperSize*0.5, HEIGHT*0.5-paperSize*0.5);		
		p.fill(0, 0, 0);
		p.stroke(0, 0, 0);
		drawCoordinateFrame(p);

		if(mouseXScaled != undefined && mouseYScaled != undefined){
			for(var i = 0; i < closestNodes.length; i++){
				p.stroke(50*i, 50*i, 50*i);
				p.line(mouseXScaled, mouseYScaled, closestNodes[i].x, 
				                                   closestNodes[i].y);
			}
		}		
		p.stroke(0, 0, 0);
		drawGraphPoints(p, g);
		if(mouseXScaled != undefined && mouseYScaled != undefined && closestNode != undefined){
			p.line(mouseXScaled, mouseYScaled, closestNode.x, closestNode.y);
			// p.fill(255, 0, 0);
			// p.stroke(255, 0, 0);
			// p.ellipse(closestNode.x, closestNode.y, .03, .03);
		}
		if(closestNodes != undefined && closestNodes.length > 0){
			p.stroke(255, 0, 0);
			p.ellipse(closestNodes[0].x, closestNodes[0].y, .01, .01);
		}
	}

	p.mouseMoved = function(event){
		mouseXScaled = p.mouseX / paperSize;
		mouseYScaled = p.mouseY / paperSize;
		if(mouseXScaled < 0.0 || mouseXScaled > 1.0) mouseXScaled = undefined;
		if(mouseYScaled < 0.0 || mouseYScaled > 1.0) mouseYScaled = undefined;
		closestNode = g.getNearestNode(mouseXScaled, mouseYScaled);
		closestNodes = g.getNearestNodes(mouseXScaled, mouseYScaled, 1);
		if(p.callback != undefined){
			p.callback({'x':mouseXScaled, 'y':mouseYScaled, 'node':closestNode});
		}
	}

	p.mouseReleased = function(){
		if(mouseXScaled != undefined && mouseYScaled != undefined){
			reset();
		}
	}
};