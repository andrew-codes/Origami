// generate faces
faces_random_callback = undefined;

var randomFaces = new OrigamiPaper("canvas-faces-random");
randomFaces.zoomToFit(0.05);
randomFaces.style.mark.strokeColor = {gray:0.0, alpha:1.0};

randomFaces.selectNearestEdge = true;

randomFaces.reset = function(){
	paper = this.scope; 
	randomFaces.cp.clear();
	for(var i = 0; i < 10; i++){
		randomFaces.cp.creaseThroughPoints(new XY(Math.random(), Math.random()), new XY(Math.random(), Math.random()) );
	}
	var intersections = randomFaces.cp.fragment();
	randomFaces.cp.generateFaces();
	randomFaces.init();
	if(faces_random_callback != undefined){
		faces_random_callback(intersections);
	}
}
randomFaces.reset();

randomFaces.onFrame = function(event) { }
randomFaces.onResize = function(event) { }
randomFaces.onMouseDown = function(event){ 
	randomFaces.reset();
}
randomFaces.onMouseUp = function(event){ }
randomFaces.onMouseMove = function(event) { }