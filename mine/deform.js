var callbackReport;

nearestNode = undefined;
project.movingNode = undefined;
project.mNodeOriginalLocation = undefined;
project.nNode = undefined;
project.selectNearestNode = true;
project.style.valley.strokeColor = project.style.mountain.strokeColor;
project.style.selectedNode = { 
	fillColor: undefined, 
	strokeWidth: 0.005,
	radius: 0.02,
	strokeColor: { gray:0 }
}
project.style.nodes = { 
	visible: true,
	fillColor: undefined,
	strokeColor: undefined,
	strokeWidth: 0.0,
	radius: 0.02
};

project.colorNodesFlatFoldable = function(){
	for(var i = 0; i < this.cp.nodes.length; i++){
		var color = { hue:130, saturation:0.8, brightness:0.7, alpha:0.5 }
		if( !this.cp.nodes[i].flatFoldable() ){ 
			color = { hue:0, saturation:0.8, brightness:1, alpha:0.5 } 
		}
		this.nodes[i].fillColor = color;
	}
}

project.reset = function(){
	project.cp.clear();
	project.init();
}
project.reset();

project.onFrame = function(event) { }
project.onResize = function(event) { }
project.onMouseDown = function(event){ 
	this.movingNode = this.cp.getNearestNode( event.point.x, event.point.y );
	this.mNodeOriginalLocation = new XY(this.movingNode.x, this.movingNode.y);
	if(this.cp != undefined){ this.colorNodesFlatFoldable(); }
}
project.onMouseUp = function(event){ 
	if(this.movingNode != undefined && this.mNodeOriginalLocation != undefined){
		// this.movingNode.x = this.mNodeOriginalLocation.x;
		// this.movingNode.y = this.mNodeOriginalLocation.y;
		this.movingNode = undefined;
		this.mNodeOriginalLocation = undefined;
		this.update();
	}
	if(this.cp != undefined){ this.colorNodesFlatFoldable(); }
}
project.onMouseMove = function(event) { 
	if(this.movingNode != undefined){
		this.movingNode.x = event.point.x;
		this.movingNode.y = event.point.y;
		this.update();
	} else{
		var nNode = this.cp.getNearestNode( event.point.x, event.point.y );
		if(nearestNode !== nNode){
			nearestNode = nNode;
		}
	}
	if(this.cp != undefined){ this.colorNodesFlatFoldable(); }
	if(callbackReport != undefined){
		callbackReport({'point':event.point, 'node':nearestNode.index, 'valid':nearestNode.flatFoldable()});
	}
}
