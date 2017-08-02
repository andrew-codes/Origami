
function chop_collinear_vert(){
	var canvas = document.getElementById('canvas-chop-collinear-vert');
	var scope = new paper.PaperScope();
	// setup paper scope with canvas
	scope.setup(canvas);
	zoomView(scope, canvas.width, canvas.height, 0.5);

var cp;
var paperCP;

	cp = new CreasePattern();
	paperCP = new PaperCreasePattern(scope, cp);

	var nearestEdge = undefined;
	var nearestNode = undefined;

	var NUM_LINES = 30;

	var mouseNodeLayer = new paper.Layer();
	mouseNodeLayer.activate();
	mouseNodeLayer.removeChildren();
	var nodeCircle = new paper.Shape.Circle({
		center: [0, 0],
		radius: 0.01,
		fillColor: { hue:0, saturation:0.8, brightness:1 }//{ hue:130, saturation:0.8, brightness:0.7 }
	});

	function resetCP(){
		cp.clear();
		cp.nodes = [];
		cp.edges = [];
		cp.creaseOnly(new XYPoint(0.5, 0.0), new XYPoint(0.5, 1.0));

		for(var i = 0; i < NUM_LINES; i++){
			var y = .1 + .8*(i/(NUM_LINES-1));
			cp.creaseOnly( new XYPoint(Math.random(), y), new XYPoint(0.5, y) );
		}
		var crossings = cp.chop();
		console.log(crossings);
		paperCP.initialize();
	}
	resetCP();

	scope.view.onFrame = function(event){ }
	scope.view.onResize = function(event){
		paper = scope;
		zoomView(scope, canvas.width, canvas.height, 0.5);
	}
	scope.view.onMouseMove = function(event){ 
		mousePos = event.point;
		var nNode = cp.getNearestNode( mousePos.x, mousePos.y );
		var nEdge = cp.getNearestEdge( mousePos.x, mousePos.y ).edge;
		if(nearestNode !== nNode){
			nearestNode = nNode;
			nodeCircle.position.x = nearestNode.x;
			nodeCircle.position.y = nearestNode.y;
			// console.log("Node: " + nearestNode);
		}
		if(nearestEdge !== nEdge){
			nearestEdge = nEdge;
			for(var i = 0; i < cp.edges.length; i++){
				if(nearestEdge != undefined && nearestEdge === cp.edges[i]){
					// paperCP.edges[i].strokeWidth = paperCP.lineWeight*2;
					paperCP.edges[i].strokeColor = { hue:0, saturation:0.8, brightness:1 };
				} else{
					// paperCP.edges[i].strokeWidth = paperCP.lineWeight;
					paperCP.edges[i].strokeColor = paperCP.colorForCrease(cp.edges[i].orientation);
				}
			}
			// console.log("Edge: " + nearestEdge);
		}
	}

	scope.view.onMouseDown = function(event){
		paper = scope;
		resetCP();
	}

}  chop_collinear_vert();