// planarGraph.js
// a planar graph data structure containing edges and vertices in 2D space
// mit open source license, robby kraft

/// <reference path="graph.ts"/>

"use strict";

var EPSILON_LOW  = 0.003;
var EPSILON      = 0.00001;
var EPSILON_HIGH = 0.00000001;
var EPSILON_UI   = 0.05;  // user tap, based on precision of a finger on a screen
var EPSILON_COLLINEAR = EPSILON_LOW;//Math.PI * 0.001; // what decides 2 similar angles

//////////////////////////// TYPE CHECKING //////////////////////////// 
function isValidPoint(point:XY):boolean{return(point!==undefined&&!isNaN(point.x)&&!isNaN(point.y));}
function isValidNumber(n:number):boolean{return(n!==undefined&&!isNaN(n)&&!isNaN(n));}
/////////////////////////////// NUMBERS /////////////////////////////// 
function map(input:number, fl1:number, ceil1:number, fl2:number, ceil2:number):number{
	return ( (input - fl1) / (ceil1 - fl1) ) * (ceil2 - fl2) + fl2;
}
/** are 2 numbers similar to each other within an epsilon range. */
function epsilonEqual(a:number, b:number, epsilon?:number):boolean{
	if(epsilon === undefined){ epsilon = EPSILON_HIGH; }
	return ( Math.abs(a - b) < epsilon );
}
// if number is within epsilon range of a whole number, remove the floating point noise.
//  example: turns 0.999999989764 into 1.0
function wholeNumberify(num:number):number{
	if(Math.abs(Math.round(num) - num) < EPSILON_HIGH){ num = Math.round(num); }
	return num;
}
/////////////////////////////// ARRAYS /////////////////////////////// 
/** all values in an array are equivalent based on != comparison */
function allEqual(args:boolean[]):boolean {
	for(var i = 1; i < args.length; i++){ if(args[i] != args[0]) return false;}
	return true;
}
function arrayContainsObject(array, object):boolean{
	for(var i = 0; i < array.length; i++) { if(array[i] === object){ return true; } }
	return false;
}
function arrayRemoveDuplicates(array, compFunction):any[]{
	if(array.length <= 1) return array;
	for(var i = 0; i < array.length-1; i++){
		for(var j = array.length-1; j > i; j--){
			if(compFunction(array[i], array[j])){
				array.splice(j,1);
			}
		}
	}
	return array;
}
/////////////////////////////////////////////////////////////////////////////////
//                            2D ALGORITHMS
/////////////////////////////////////////////////////////////////////////////////
function interpolate(p1:XY, p2:XY, pct:number):XY{
	var inv = 1.0 - pct;
	return new XY(p1.x*pct + p2.x*inv, p1.y*pct + p2.y*inv);
}
/** if points are all collinear, checks if point lies on line segment 'ab' */
function onSegment(point:XY, a:XY, b:XY, epsilon?:number):boolean{
	if(epsilon === undefined){ epsilon = EPSILON; }
	var a_b = Math.sqrt( Math.pow(a.x - b.x,  2) + Math.pow(a.y - b.y,  2) );
	var p_a = Math.sqrt( Math.pow(point.x-a.x,2) + Math.pow(point.y-a.y,2) );
	var p_b = Math.sqrt( Math.pow(point.x-b.x,2) + Math.pow(point.y-b.y,2) );
	return (Math.abs(a_b - (p_a+p_b)) < epsilon);
}
/** There are 2 angles between 2 vectors (angle in radians), from A to B, return the clockwise one  */
function clockwiseAngleFrom(a:number, b:number):number{
	while(a < 0){ a += Math.PI*2; }
	while(b < 0){ b += Math.PI*2; }
	var a_b = a - b;
	if(a_b >= 0) return a_b;
	return Math.PI*2 - (b - a);
}
function linesParallel(p0:XY, p1:XY, p2:XY, p3:XY, epsilon?:number):boolean {
	if(epsilon === undefined){ epsilon = EPSILON; }
	// p0-p1 is first line, p2-p3 is second line
	var u = new XY(p1.x - p0.x, p1.y - p0.y);
	var v = new XY(p3.x - p2.x, p3.y - p2.y);
	return (Math.abs( u.dot( v.rotate90() ) ) < epsilon);
}
function minDistBetweenPointLine(a:XY, b:XY, x:number, y:number):XY{
	// (a)-(b) define the line, (x,y) is the point
	var p = Math.sqrt(Math.pow(b.x-a.x,2) + Math.pow(b.y-a.y,2));
	var u = ((x-a.x)*(b.x-a.x) + (y-a.y)*(b.y-a.y)) / (Math.pow(p,2));
	if(u < 0 || u > 1.0) return undefined;
	return new XY(a.x + u*(b.x-a.x), a.y + u*(b.y-a.y));
}
function rayLineSegmentIntersection(rayOrigin:XY, rayDirection:XY, point1:XY, point2:XY){
	var v1 = new XY(rayOrigin.x - point1.x, rayOrigin.y - point1.y);
	var vLineSeg = new XY(point2.x - point1.x, point2.y - point1.y);
	var vRayPerp = new XY(-rayDirection.y, rayDirection.x);
	var dot = vLineSeg.x*vRayPerp.x + vLineSeg.y*vRayPerp.y;
	if (Math.abs(dot) < EPSILON){ return undefined; }
	var cross = (vLineSeg.x*v1.y-vLineSeg.y*v1.x);
	var t1 = cross / dot;
	var t2 = (v1.x*vRayPerp.x + v1.y*vRayPerp.y) / dot;
	if (t1 >= 0.0 && (t2 >= 0.0 && t2 <= 1.0)){
		return new XY(rayOrigin.x + rayDirection.x * t1, rayOrigin.y + rayDirection.y * t1);
		// todo: really, we need to move beyond the need for whole numbers
		// var x = wholeNumberify(rayOrigin.x + rayDirection.x * t1);
		// var y = wholeNumberify(rayOrigin.y + rayDirection.y * t1);
		// return new XY(x, y);
	}
}
function lineIntersectionAlgorithm(p0:XY, p1:XY, p2:XY, p3:XY):XY {
	// p0-p1 is first line, p2-p3 is second line
	var rise1 = (p1.y-p0.y);
	var run1  = (p1.x-p0.x);
	var rise2 = (p3.y-p2.y);
	var run2  = (p3.x-p2.x);
	var denom = run1 * rise2 - run2 * rise1;
	// var denom = l1.u.x * l2.u.y - l1.u.y * l2.u.x;
	if(denom == 0) return undefined;
	// return XY((l1.d * l2.u.y - l2.d * l1.u.y) / denom, (l2.d * l1.u.x - l1.d * l2.u.x) / denom);
	var s02 = {'x':p0.x - p2.x, 'y':p0.y - p2.y};
	var t = (run2 * s02.y - rise2 * s02.x) / denom;
	return new XY(p0.x + (t * run1), p0.y + (t * rise1) );
}
function lineSegmentIntersectionAlgorithm(p:XY, p2:XY, q:XY, q2:XY):XY {
	var r = new XY(p2.x - p.x, p2.y - p.y);
	var s = new XY(q2.x - q.x, q2.y - q.y);
	var uNumerator = (new XY(q.x - p.x, q.y - p.y)).cross(r);//crossProduct(subtractPoints(q, p), r);
	var denominator = r.cross(s);
	if(onSegment(p, q, q2)){ return p; }
	if(onSegment(p2, q, q2)){ return p2; }
	if(onSegment(q, p, p2)){ return q; }
	if(onSegment(q2, p, p2)){ return q2; }
	if (Math.abs(uNumerator) < EPSILON_HIGH && Math.abs(denominator) < EPSILON_HIGH) {
		// collinear
		// Do they overlap? (Are all the point differences in either direction the same sign)
		if(!allEqual([(q.x - p.x) < 0, (q.x - p2.x) < 0, (q2.x - p.x) < 0, (q2.x - p2.x) < 0]) ||
		   !allEqual([(q.y - p.y) < 0, (q.y - p2.y) < 0, (q2.y - p.y) < 0, (q2.y - p2.y) < 0])){
			return undefined;
		}		
		// Do they touch? (Are any of the points equal?)
		if(p.equivalent(q)){ return new XY(p.x, p.y); }
		if(p.equivalent(q2)){ return new XY(p.x, p.y); }
		if(p2.equivalent(q)){ return new XY(p2.x, p2.y); }
		if(p2.equivalent(q2)){ return new XY(p2.x, p2.y); }
	}
	if (Math.abs(denominator) < EPSILON_HIGH) {
		// parallel
		return undefined;
	}
	var u = uNumerator / denominator;
	var t = (new XY(q.x - p.x, q.y - p.y)).cross(s) / denominator;
	if((t >= 0) && (t <= 1) && (u >= 0) && (u <= 1)){
		return new XY(p.x + r.x*t, p.y + r.y*t);
	}
}
function circleLineIntersectionAlgorithm(center:XY, radius:number, p0:XY, p1:XY):XY[]{
	var r_squared =  Math.pow(radius,2);
	var x1 = p0.x - center.x;
	var y1 = p0.y - center.y;
	var x2 = p1.x - center.x;
	var y2 = p1.y - center.y;
	var dx = x2 - x1;
	var dy = y2 - y1;
	var dr_squared = dx*dx + dy*dy;
	var D = x1*y2 - x2*y1;
	function sgn(x){ if(x < 0){return -1;} return 1; }
	var x1 = (D*dy + sgn(dy)*dx*Math.sqrt(r_squared*dr_squared - (D*D)))/(dr_squared);
	var x2 = (D*dy - sgn(dy)*dx*Math.sqrt(r_squared*dr_squared - (D*D)))/(dr_squared);
	var y1 = (-D*dx + Math.abs(dy)*Math.sqrt(r_squared*dr_squared - (D*D)))/(dr_squared);
	var y2 = (-D*dx - Math.abs(dy)*Math.sqrt(r_squared*dr_squared - (D*D)))/(dr_squared);
	var intersections = [];
	if(!isNaN(x1)){ intersections.push( new XY(x1 + center.x, y1 + center.y) ); }
	if(!isNaN(x2)){ intersections.push( new XY(x2 + center.x, y2 + center.y) ); }
	return intersections;
}
function convexHull(points:XY[]):XY[]{
	// validate input
	if(points === undefined || points.length === 0){ return []; }
	// # points in the convex hull before escaping function
	var INFINITE_LOOP = 10000;
	// sort points by x and y
	var sorted = points.sort(function(a,b){
			if(a.x-b.x < -EPSILON_HIGH){ return -1; }  if(a.x-b.x > EPSILON_HIGH){ return 1; }
			if(a.y-b.y < -EPSILON_HIGH){ return -1; }  if(a.y-b.y > EPSILON_HIGH){ return 1; }
			return 0;});
	var hull = [];
	hull.push(sorted[0]);
	// the current direction the perimeter walker is facing
	var ang = 0;  
	var infiniteLoop = 0;
	do{
		infiniteLoop++;
		var h = hull.length-1;
		var angles = sorted
			// remove all points in the same location from this search
			.filter(function(el){ 
				return !(epsilonEqual(el.x, hull[h].x, EPSILON_HIGH) && epsilonEqual(el.y, hull[h].y, EPSILON_HIGH)) })
			// sort by angle, setting lowest values next to "ang"
			.map(function(el){
				var angle = Math.atan2(hull[h].y - el.y, hull[h].x - el.x);
				while(angle < ang){ angle += Math.PI*2; }
				return {node:el, angle:angle, distance:undefined}; })  // distance to be set later
			.sort(function(a,b){return (a.angle < b.angle)?-1:(a.angle > b.angle)?1:0});
		if(angles.length === 0){ return []; }
		// narrowest-most right turn
		var rightTurn = angles[0];
		// collect all other points that are collinear along the same ray
		angles = angles.filter(function(el){ return epsilonEqual(rightTurn.angle, el.angle, EPSILON_LOW); })
		// sort collinear points by their distances from the connecting point
		.map(function(el){ 
			var distance = Math.sqrt(Math.pow(hull[h].x-el.node.x, 2) + Math.pow(hull[h].y-el.node.y, 2));
			el.distance = distance;
			return el;})
		// (OPTION 1) exclude all collinear points along the hull 
		.sort(function(a,b){return (a.distance < b.distance)?1:(a.distance > b.distance)?-1:0});
		// (OPTION 2) include all collinear points along the hull
		// .sort(function(a,b){return (a.distance < b.distance)?-1:(a.distance > b.distance)?1:0});
		// if the point is already in the convex hull, we've made a loop. we're done
		if(arrayContainsObject(hull, angles[0].node)){ return hull; }
		// add point to hull, prepare to loop again
		hull.push(angles[0].node);
		// update walking direction with the angle to the new point
		ang = Math.atan2( hull[h].y - angles[0].node.y, hull[h].x - angles[0].node.x);
	}while(infiniteLoop < INFINITE_LOOP);
	return [];
}
/////////////////////////////////////////////////////////////////////////////////
//                                 CLASSES
/////////////////////////////////////////////////////////////////////////////////

class XY{
	x:number;
	y:number;
	constructor(x:number, y:number){
		this.x = x;
		this.y = y;
	}
	values():[number, number]{ return [this.x, this.y]; }
	// position(x:number, y:number):XY{ this.x = x; this.y = y; return this; }
	// translated(dx:number, dy:number):XY{ this.x += dx; this.y += dy; return this;}
	normalize():XY { var m = this.mag(); return new XY(this.x/m, this.y/m);}
	rotate90():XY { return new XY(-this.y, this.x); }
	rotate(origin:XY, angle:number){
		var dx = this.x-origin.x;
		var dy = this.y-origin.y;
		var radius = Math.sqrt( Math.pow(dy, 2) + Math.pow(dx, 2) );
		var currentAngle = Math.atan2(dy, dx);
		return new XY(origin.x + radius*Math.cos(currentAngle + angle),
					  origin.y + radius*Math.sin(currentAngle + angle));
	}
	dot(point:XY):number { return this.x * point.x + this.y * point.y; }
	cross(vector:XY):number{ return this.x*vector.y - this.y*vector.x; }
	mag():number { return Math.sqrt(this.x * this.x + this.y * this.y); }
	equivalent(point:XY, epsilon?:number):boolean{
		if(epsilon == undefined){ epsilon = EPSILON_HIGH; }
		// rect bounding box, cheaper than radius calculation
		return (epsilonEqual(this.x, point.x, epsilon) && epsilonEqual(this.y, point.y, epsilon))
	}
	transform(matrix):XY{
		return new XY(this.x * matrix.a + this.y * matrix.c + matrix.tx,
					  this.x * matrix.b + this.y * matrix.d + matrix.ty);
	}
	/** reflects this point about a line that passes through 'a' and 'b' */
	reflect(a:XY,b:XY):XY{
		return this.transform( new Matrix().reflection(a,b) );
	}
	distance(a:XY):number{
		return Math.sqrt( Math.pow(this.x-a.x,2) + Math.pow(this.y-a.y,2) );
	}
}
/** This is a 2x3 matrix: 2x2 for scale and rotation and 2x1 for translation */
class Matrix{
	a:number; c:number; tx:number;
	b:number; d:number; ty:number;
	constructor(a?:number, b?:number, c?:number, d?:number, tx?:number, ty?:number){
		this.a=a; this.b=b; this.c=c; this.d=d; this.tx=tx; this.ty=ty;
		if(a === undefined){ this.a = 1; }
		if(b === undefined){ this.b = 0; }
		if(c === undefined){ this.c = 0; }
		if(d === undefined){ this.d = 1; }
		if(tx === undefined){ this.tx = 0; }
		if(ty === undefined){ this.ty = 0; }
	}
	/** Sets this to be the identity matrix */
	identity(){ this.a=1; this.b=0; this.c=0; this.d=1; this.tx=0; this.ty=0; }
	/** Returns a new matrix, the sum of this and the argument. Will not change this or the argument
	 * @returns {Matrix} 
	 */
	mult(matrix:Matrix):Matrix{
		var m1 = this.copy();
		var m2 = matrix.copy();
		var r = new Matrix();
		r.a = m1.a * m2.a + m1.c * m2.b;
		r.c = m1.a * m2.c + m1.c * m2.d;
		r.tx = m1.a * m2.tx + m1.c * m2.ty + m1.tx;
		r.b = m1.b * m2.a + m1.d * m2.b;
		r.d = m1.b * m2.c + m1.d * m2.d;
		r.ty = m1.b * m2.tx + m1.d * m2.ty + m1.ty;
		return r;
	}
	/** Calculates the matrix representation of a reflection across a line
	 * @returns {Matrix} 
	 */
	reflection(a:XY, b:XY):Matrix{
		var angle = Math.atan2(b.y-a.y, b.x-a.x);
		this.a = Math.cos(angle) *  Math.cos(-angle) +  Math.sin(angle) * Math.sin(-angle);
		this.b = Math.cos(angle) * -Math.sin(-angle) +  Math.sin(angle) * Math.cos(-angle);
		this.c = Math.sin(angle) *  Math.cos(-angle) + -Math.cos(angle) * Math.sin(-angle);
		this.d = Math.sin(angle) * -Math.sin(-angle) + -Math.cos(angle) * Math.cos(-angle);
		this.tx = a.x + this.a * -a.x + -a.y * this.c;
		this.ty = a.y + this.b * -a.x + -a.y * this.d;
		return this;
	}
	/** Deep-copy the Matrix and return it as a new object
	 * @returns {Matrix} 
	 */
	copy():Matrix{
		var m = new Matrix();
		m.a = this.a;   m.c = this.c;   m.tx = this.tx;
		m.b = this.b;   m.d = this.d;   m.ty = this.ty;
		return m;
	}
}
class AdjacentNodes{
	// node adjacent to node, with angle offset and connecting edge
	parent:PlanarNode;  // "first" node, polarity required for angle calculation
	node:PlanarNode;
	angle:number; // radians, angle from parent to node
	edge:PlanarEdge;  // edge connecting the two nodes
	constructor(parent:PlanarNode, node:PlanarNode, edge:PlanarEdge){
		this.node = node;
		this.angle = Math.atan2(node.y-parent.y, node.x-parent.x);
		this.edge = edge;
		// optional
		this.parent = parent;
	}
}
// class AdjacentFace{
// 	face:PlanarFace;
// 	parentEdge:PlanarEdge; // edge connecting to parent
// 	adjacent:AdjacentFace[];
// 	constructor(face:PlanarFace){
// 		this.face = face;
// 		this.adjacent = [];
// 	}
// }
class EdgeIntersection extends XY{
	// this is a unique class- used in intersection(), crossingEdges() on PlanarEdge
	edge:PlanarEdge;
	constructor(otherEdge:PlanarEdge, intersectionX:number, intersectionY:number){
		super(intersectionX, intersectionY);
		this.edge = otherEdge;
	}
}
class InteriorAngle{
	edges:[PlanarEdge,PlanarEdge];
	node:PlanarNode;
	angle:number;
	constructor(edge1:PlanarEdge, edge2:PlanarEdge){
		this.node = <PlanarNode>edge1.commonNodeWithEdge(edge2);
		if(this.node === undefined){ return undefined; }
		this.angle = clockwiseAngleFrom(edge1.absoluteAngle(this.node), edge2.absoluteAngle(this.node));
		this.edges = [edge1, edge2];
	}
	equivalent(a:InteriorAngle):boolean{
		if( (a.edges[0].isSimilarToEdge(this.edges[0]) && a.edges[1].isSimilarToEdge(this.edges[1])) ||
			(a.edges[0].isSimilarToEdge(this.edges[1]) && a.edges[1].isSimilarToEdge(this.edges[0]))){
			return true;
		}
		return false;
	}
}

class PlanarCleanReport extends GraphCleanReport{
	edges:{duplicate:number, circular:number};
	nodes:{
		fragment:XY[];  // nodes added at intersection of 2 lines, from fragment()
		collinear:XY[]; // nodes removed due to being collinear
		duplicate:XY[]; // nodes removed due to occupying the same space
		isolated:number;  // nodes removed for being unattached to any edge
	}
	constructor(){
		super();
		this.edges = {duplicate:0, circular:0};
		this.nodes = {
			isolated:0,
			fragment:[],
			collinear:[],
			duplicate:[]
		}
	}
	join(report:GraphCleanReport):PlanarCleanReport{
		this.nodes.isolated += report.nodes.isolated;
		this.edges.duplicate += report.edges.duplicate;
		this.edges.circular += report.edges.circular;
		// if we are merging 2 planar clean reports, type cast this variable and check properties
		var planarReport = <PlanarCleanReport>report;
		if(planarReport.nodes.fragment !== undefined){ 
			this.nodes.fragment = this.nodes.fragment.concat(planarReport.nodes.fragment); 
		}
		if(planarReport.nodes.collinear !== undefined){ 
			this.nodes.collinear = this.nodes.collinear.concat(planarReport.nodes.collinear);
		}
		if(planarReport.nodes.duplicate !== undefined){ 
			this.nodes.duplicate = this.nodes.duplicate.concat(planarReport.nodes.duplicate);
		}
		return this;
	}
}

// class NearestEdgeObject {
// 	edge:PlanarEdge; 
// 	pointOnEdge:XY;
// 	distance:number;
// 	constructor(edge:PlanarEdge, pointOnEdge:XY, distance:number){
// 		this.edge = edge;
// 		this.pointOnEdge = pointOnEdge;
// 		this.distance = distance;
// 	}
// }
// class PlanarAngle{
// 	// the radial space between 2 edges
// 	// an angle defined by two adjacent edges
// 	node:PlanarNode;    // center node
// 	edges:[PlanarEdge,PlanarEdge];  // two adjacent edges
// 	angle:number; // radians
// 	constructor(node:PlanarNode, edge1:PlanarEdge, edge2:PlanarEdge, angle){
// 		var nodeInCommon = <PlanarNode>edge1.nodeInCommon(edge2);
// 		this.node = nodeInCommon;
// 		this.angle = 0;//Math.atan2(node.y-parent.y, node.x-parent.x);
// 		this.edges = [edge1, edge2];
// 	}
// }

class PlanarNode extends GraphNode{

	graph:PlanarGraph;
	x:number;
	y:number;

	adjacentFaces():PlanarFace[]{
		var adjacentFaces = [];
		var adj = this.planarAdjacent();
		for(var n = 0; n < adj.length; n++){
			var face = this.graph.makeFace( this.graph.findClockwiseCircut(this, adj[n].node) );
			if(face != undefined){ adjacentFaces.push(face); }
		}
		return adjacentFaces;
	}

	interiorAngles():InteriorAngle[]{
		var adj = this.planarAdjacent();
		// if this node is a leaf, should 1 angle be 360 degrees? or no interior angles
		if(adj.length <= 1){ return []; }
		return adj.map(function(el, i){
			var nextI = (i+1)%this.length;
			// var angleDifference = clockwiseAngleFrom(this[i].angle, this[nextI].angle);
			return new InteriorAngle(this[i].edge, this[nextI].edge);
		}, adj);
	}

	/** Adjacent nodes sorted clockwise by angle toward adjacent node, type AdjacentNodes object */
	planarAdjacent():AdjacentNodes[]{
		return (<PlanarEdge[]>this.adjacentEdges())
			.map(function(el){ 
				if(this === el.nodes[0]) return new AdjacentNodes(el.nodes[0], el.nodes[1], el);
				else                     return new AdjacentNodes(el.nodes[1], el.nodes[0], el);
			},this)
			.sort(function(a,b){return (a.angle < b.angle)?1:(a.angle > b.angle)?-1:0});
	}

	/** Locates the most clockwise adjacent node from the node supplied in the argument. If this was a clock centered at this node, if you pass in node for the number 3, it will return you the number 4.
	 * @returns {AdjacentNodes} AdjacentNodes object containing the clockwise node and the edge connecting the two.
	 */
	adjacentNodeClockwiseFrom(node:PlanarNode):AdjacentNodes{
		var adjacentNodes:AdjacentNodes[] = this.planarAdjacent();
		for(var i = 0; i < adjacentNodes.length; i++){
			if(adjacentNodes[i].node === node){
				return adjacentNodes[ ((i+1)%adjacentNodes.length) ];
			}
		}
		return undefined;
	}

// implements XY
	values():[number, number]{ return [this.x, this.y]; }
// todo: probably need to break apart XY and this. this modifies the x and y in place. XY returns a new one and doesn't modify the current one in place
	position(x:number, y:number):PlanarNode{ this.x = x; this.y = y; return this; }
	translate(dx:number, dy:number):PlanarNode{ this.x += dx; this.y += dy; return this;}
	normalize():PlanarNode { var m = this.mag(); this.x /= m; this.y /= m; return this; }
	rotate90():PlanarNode { var x = this.x; this.x = -this.y; this.y = x; return this; }
	rotate(origin:XY, angle:number):PlanarNode{
		var dx = this.x-origin.x;
		var dy = this.y-origin.y;
		var radius = Math.sqrt( Math.pow(dy, 2) + Math.pow(dx, 2) );
		var currentAngle = Math.atan2(dy, dx);
		this.x = origin.x + radius*Math.cos(currentAngle + angle);
		this.y = origin.y + radius*Math.sin(currentAngle + angle);
		return this;
	}
	dot(point:XY):number { return this.x * point.x + this.y * point.y; }
	cross(vector:XY):number{ return this.x*vector.y - this.y*vector.x; }
	mag():number { return Math.sqrt(this.x * this.x + this.y * this.y); }
	equivalent(point:XY, epsilon?:number):boolean{
		if(epsilon == undefined){ epsilon = EPSILON_HIGH; }
		// rect bounding box, cheaper than radius calculation
		return (epsilonEqual(this.x, point.x, epsilon) && epsilonEqual(this.y, point.y, epsilon))
	}
	transform(matrix):PlanarNode{
		var xx = this.x; var yy = this.y;
		this.x = xx * matrix.a + yy * matrix.c + matrix.tx;
		this.y = xx * matrix.b + yy * matrix.d + matrix.ty;
		return this;
	}
	/** reflects about a line that passes through 'a' and 'b' */
	reflect(a:XY,b:XY):XY{
		return this.transform( new Matrix().reflection(a,b) );
	}
	distance(a:XY):number{
		return Math.sqrt( Math.pow(this.x-a.x,2) + Math.pow(this.y-a.y,2) );
	}
}

class PlanarEdge extends GraphEdge{

	graph:PlanarGraph;
	nodes:[PlanarNode,PlanarNode];

	midpoint():XY { return new XY( 0.5*(this.nodes[0].x + this.nodes[1].x),
								   0.5*(this.nodes[0].y + this.nodes[1].y));}

	intersection(edge:PlanarEdge):EdgeIntersection{
		// todo: should intersecting adjacent edges return the point in common they have with each other?
		if(this.isAdjacentToEdge(edge)){ return undefined; }
		var intersect = lineSegmentIntersectionAlgorithm(this.nodes[0], this.nodes[1], edge.nodes[0], edge.nodes[1]);
		if(intersect == undefined){ return undefined; }
		if(intersect.equivalent(this.nodes[0]) || intersect.equivalent(this.nodes[1])){return undefined;}
		// console.log(this.nodes[0].x + "," + this.nodes[0].y + ":" + this.nodes[1].x + "," + this.nodes[1].y + " and " + edge.nodes[0].x + "," + edge.nodes[0].y + ":" + edge.nodes[1].x + "," + edge.nodes[1].y + "  =  " + intersect.x + "," + intersect.y);
		return new EdgeIntersection(edge, intersect.x, intersect.y);
	}

	crossingEdges():EdgeIntersection[]{
		return this.graph.edges
			.filter(function(el){ return this !== el}, this)
			.map(function(el){ return this.intersection(el) }, this)
			.filter(function(el){ return el != undefined})
			.sort(function(a,b){
				if(a.x-b.x < -EPSILON_HIGH){ return -1; }
				if(a.x-b.x > EPSILON_HIGH){ return 1; }
				if(a.y-b.y < -EPSILON_HIGH){ return -1; }
				if(a.y-b.y > EPSILON_HIGH){ return 1; }
				return 0;});
	}

	absoluteAngle(startNode?:PlanarNode):number{  // startNode is one of this edge's 2 nodes
		// if not specified it will pick one node
		if(startNode === undefined){ startNode = this.nodes[1]; }
		// measure edge as if it were a ray from one node to the other
		var endNode;
		if(startNode === this.nodes[0]){ endNode = this.nodes[1]; }
		else if(startNode === this.nodes[1]){ endNode = this.nodes[0]; }
		else{ return undefined; }
		return Math.atan2(endNode.y-startNode.y, endNode.x-startNode.x);
	}

	adjacentFaces():PlanarFace[]{
		return [ this.graph.makeFace( this.graph.findClockwiseCircut(this.nodes[0], this.nodes[1]) ),
				 this.graph.makeFace( this.graph.findClockwiseCircut(this.nodes[1], this.nodes[0]) ) ]
				 .filter(function(el){ return el !== undefined });
	}
	transform(matrix){
		this.nodes[0].transform(matrix);
		this.nodes[1].transform(matrix);
	}
	// if this edge is the line of reflection, returns the matrix representation form
	reflectionMatrix():Matrix{ return new Matrix().reflection(this.nodes[0], this.nodes[1]); }
}

class PlanarFace{
	// this library is counting on the edges and nodes to be stored in clockwise winding
	graph:PlanarGraph;
	nodes:PlanarNode[];
	edges:PlanarEdge[];
	angles:number[];
	index:number;

	constructor(graph:PlanarGraph){
		this.graph = graph;
		this.nodes = [];
		this.edges = [];
		this.angles = [];
	}
	equivalent(face:PlanarFace):boolean{
		// quick check, only verfies nodes
		if(face.nodes.length != this.nodes.length) return false;
		var iFace = undefined;
		for(var i = 0; i < this.nodes.length; i++){
			if(this.nodes[0] === face.nodes[i]){ iFace = i; break; }
		}
		if(iFace == undefined) return false;
		for(var i = 0; i < this.nodes.length; i++){
			var iFaceMod = (iFace + i) % this.nodes.length;
			if(this.nodes[i] !== face.nodes[iFaceMod]) return false;
		}
		return true;
	}
	commonEdge(face:PlanarFace):PlanarEdge{
		// faces will have only 1 edge in common if all faces are convex
		for(var i = 0; i < this.edges.length; i++){
			for(var j = 0; j < face.edges.length; j++){
				if(this.edges[i] === face.edges[j]){ return this.edges[i]; }
			}
		}
	}
	commonEdges(face:PlanarFace):PlanarEdge[]{
		// faces will have only 1 edge in common if all faces are convex
		var edges = [];
		for(var i = 0; i < this.edges.length; i++){
			for(var j = 0; j < face.edges.length; j++){
				if(this.edges[i] === face.edges[j]){ edges.push(this.edges[i]); }
			}
		}
		return arrayRemoveDuplicates(edges, function(a,b){return a === b; });
	}
	uncommonEdges(face:PlanarFace):PlanarEdge[]{
		var edges = this.edges.slice(0);
		for(var i = 0; i < face.edges.length; i++){
			edges = edges.filter(function(el){return el !== face.edges[i];});
		}
		return edges;
	}
	edgeAdjacentFaces():PlanarFace[]{
		return this.edges.map(function(ed){
			var allFaces = this.graph.faces.filter(function(el){return !this.equivalent(el);},this);
			for(var i = 0; i < allFaces.length; i++){
				var adjArray = allFaces[i].edges.filter(function(ef){return ed === ef;});
				if(adjArray.length > 0){ return allFaces[i]; }
			}
		}, this).filter(function(el){return el !== undefined;});
	}
	contains(point:XY):boolean{
		for(var i = 0; i < this.edges.length; i++){
			var endpts = this.edges[i].nodes;
			var cross = (point.y - endpts[0].y) * (endpts[1].x - endpts[0].x) - 
						(point.x - endpts[0].x) * (endpts[1].y - endpts[0].y);
			if (cross < 0) return false;
		}
		return true;
	}
	transform(matrix){
		for(var i = 0; i < this.nodes.length; i++){
			this.nodes[i].transform(matrix);
		}
	}
}

class PlanarGraph extends Graph{

	nodes:PlanarNode[];
	edges:PlanarEdge[];
	faces:PlanarFace[];

	nodeType = PlanarNode;
	edgeType = PlanarEdge;

	constructor(){ super(); this.clear(); }

	// converts node objects into array of arrays notation x is [0], and y is [1]
	nodes_array():number[][]{return this.nodes.map(function(el){return [el.x, el.y]});}

	/** This will deep-copy the contents of this graph and return it as a new object
	 * @returns {PlanarGraph} 
	 */
	duplicate():PlanarGraph{
		this.nodeArrayDidChange();
		this.edgeArrayDidChange();
		var g = new PlanarGraph();
		for(var i = 0; i < this.nodes.length; i++){
			var n = g.addNode(new PlanarNode(g));
			(<any>Object).assign(n, this.nodes[i]);
			n.graph = g; n.index = i;
		}
		for(var i = 0; i < this.edges.length; i++){
			var index = [this.edges[i].nodes[0].index, this.edges[i].nodes[1].index];
			var e = g.addEdge(new PlanarEdge(g, g.nodes[index[0]], g.nodes[index[1]]));
			(<any>Object).assign(e, this.edges[i]);
			e.graph = g; e.index = i;
			e.nodes = [g.nodes[index[0]], g.nodes[index[1]]];
		}
		for(var i = 0; i < this.faces.length; i++){
			var f = new PlanarFace(g);
			(<any>Object).assign(f, this.faces[i]);
			for(var j=0;j<this.faces[i].nodes.length;j++){f.nodes.push(f.nodes[this.faces[i].nodes[j].index]);}
			for(var j=0;j<this.faces[i].edges.length;j++){f.edges.push(f.edges[this.faces[i].edges[j].index]);}
			for(var j=0;j<this.faces[i].angles.length;j++){f.angles.push(this.faces[i].angles[j]); }
			f.graph = g;
			g.faces.push(f);
		}
		return g;
	}

	width():number{
		// if(this.nodes === undefined || this.nodes.length === 0){ return 0; }
		// var leftToRight = this.nodes.sort(function(a,b){return (a.x>b.x) ? 1:((b.x>a.x) ? -1:0);} );
		// var left = leftToRight[0];
		// var right = leftToRight[leftToRight.length-1];
		// return right.x - left.x;
		return 1;
	}
	height():number{
		// if(this.nodes === undefined || this.nodes.length === 0){ return 0; }
		// var topToBottom = this.nodes.sort(function(a,b){return (a.y>b.y) ? 1:((b.y>a.y) ? -1:0);} );
		// var top = topToBottom[0];
		// var bottom = topToBottom[topToBottom.length-1];
		// return bottom.y - top.y;
		return 1;
	}

	///////////////////////////////////////////////
	// ADD PARTS
	///////////////////////////////////////////////

	/** Create a new isolated planar node at x,y
	 * @returns {PlanarNode} pointer to the node
	 */
	newPlanarNode(x:number, y:number):PlanarNode{
		return (<PlanarNode>this.newNode()).position(x, y);
	}

	/** Create two new nodes each with x,y locations and an edge between them
	 * @returns {PlanarEdge} pointer to the edge
	 */
	newPlanarEdge(x1:number, y1:number, x2:number, y2:number):PlanarEdge{
		var a = (<PlanarNode>this.newNode()).position(x1, y1);
		var b = (<PlanarNode>this.newNode()).position(x2, y2);
		return <PlanarEdge>this.newEdge(a, b);
	}

	/** Create one node with an x,y location and an edge between it and an existing node
	 * @returns {PlanarEdge} pointer to the edge
	 */
	newPlanarEdgeFromNode(node:PlanarNode, x:number, y:number):PlanarEdge{
		var newNode = (<PlanarNode>this.newNode()).position(x, y);
		return <PlanarEdge>this.newEdge(node, newNode);
	}

	/** Create one node with an x,y location and an edge between it and an existing node
	 * @returns {PlanarEdge} pointer to the edge
	 */
	newPlanarEdgeBetweenNodes(a:PlanarNode, b:PlanarNode):PlanarEdge{
		return <PlanarEdge>this.newEdge(a, b);
	}

	/** Create one node with an angle and distance away from an existing node and make an edge between them
	 * @returns {PlanarEdge} pointer to the edge
	 */
	newPlanarEdgeRadiallyFromNode(node:PlanarNode, angle:number, length:number):PlanarEdge{
		var newNode = (<PlanarNode>this.copyNode(node))
					   .translate(Math.cos(angle)*length, Math.sin(angle)*length);
		return <PlanarEdge>this.newEdge(node, newNode);
	}

	///////////////////////////////////////////////
	// REMOVE PARTS
	///////////////////////////////////////////////

	/** Removes all nodes, edges, and faces, returning the graph to it's original state */
	clear():PlanarGraph{
		this.nodes = [];
		this.edges = [];
		this.faces = [];
		return this;
	}

	/** Removes an edge and also attempt to remove the two nodes left behind if they are otherwise unused
	 * @returns {boolean} if the edge was removed
	 */
	removeEdge(edge:GraphEdge):number{
		var len = this.edges.length;
		var endNodes = [edge.nodes[0], edge.nodes[1]];
		this.edges = this.edges.filter(function(el){ return el !== edge; });
		this.edgeArrayDidChange();
		this.cleanNodeIfUseless(endNodes[0]);
		this.cleanNodeIfUseless(endNodes[1]);
		// todo: this is hitting the same node repeatedly from different sides, so keeping track of nodes is not working
		// var report = new PlanarCleanReport();
		// var a = this.cleanNodeIfUseless(endNodes[0]);
		// var b = this.cleanNodeIfUseless(endNodes[1]);
		// console.log(a +  " " + b)
		return len - this.edges.length;
	}

	/** Attempt to remove an edge if one is found that connects the 2 nodes supplied, and also attempt to remove the two nodes left behind if they are otherwise unused
	 * @returns {number} how many edges were removed
	 */
	removeEdgeBetween(node1:GraphNode, node2:GraphNode):number{
		var len = this.edges.length;
		this.edges = this.edges.filter(function(el){ 
			return !((el.nodes[0] === node1 && el.nodes[1] === node2) ||
					 (el.nodes[0] === node2 && el.nodes[1] === node1) );
		});
		this.edgeArrayDidChange();
		this.cleanNodeIfUseless(node1);
		this.cleanNodeIfUseless(node2);
		return len - this.edges.length;
	}

	/** Remove a node if it is either unconnected to any edges, or is in the middle of 2 collinear edges
	 * @returns {number} how many nodes were removed
	 */
	cleanNodeIfUseless(node):number{
		var edges = node.adjacentEdges();
		switch (edges.length){
			case 0: return this.removeNode(node);
			case 2:
				// collinear check
				var angleDiff = edges[0].absoluteAngle(node) - edges[1].absoluteAngle(node);
				// console.log("collinear check " + angleDiff);
				if(epsilonEqual(Math.abs(angleDiff), Math.PI, EPSILON_COLLINEAR)){
					var farNodes = [edges[0].uncommonNodeWithEdge(edges[1]), 
									edges[1].uncommonNodeWithEdge(edges[0])]
					// super.removeEdge(edges[0]);
					edges[0].nodes = [farNodes[0], farNodes[1]];
					var nodeLen = this.nodes.length;
					this.removeEdge(edges[1]);
					// this.newEdge(farNodes[0], farNodes[1]);
					this.removeNode(node);
					// console.log("Collinear " + (nodeLen - this.nodes.length));
					return nodeLen - this.nodes.length;
				}
			// return below, no break
		}
		return 0;
	}

	///////////////////////////////////////////////
	// REMOVE PARTS
	///////////////////////////////////////////////
	//
	// SEARCH AND REMOVE
	//

	/** Removes all isolated nodes and performs cleanNodeIfUseless() on every node
	 * @returns {number} how many nodes were removed
	 */
	cleanAllUselessNodes():PlanarCleanReport{
		var report = new PlanarCleanReport().join( this.removeIsolatedNodes() );
		var count = 0;
		for(var i = this.nodes.length-1; i >= 0; i--){
			count += this.cleanNodeIfUseless(this.nodes[i]);
		}
		report.nodes.isolated += count;
		return report;
	}

	// cleanNodes():number{
	// 	var count = this.cleanAllUselessNodes();
	// 	this.cleanDuplicateNodes();
	// 	return count;
	// }

	cleanDuplicateNodes(epsilon?:number):PlanarCleanReport{
		if(epsilon === undefined){ epsilon = EPSILON_HIGH; }
		var that = this;
		function searchAndMergeOneDuplicatePair(epsilon:number):PlanarNode{
			for(var i = 0; i < that.nodes.length-1; i++){
				for(var j = i+1; j < that.nodes.length; j++){
					if ( that.nodes[i].equivalent( that.nodes[j], epsilon) ){
						// todo, mergeNodes does repeated cleaning, suppress and move to end of function
						// that.nodes[i].x = (that.nodes[i].x + that.nodes[j].x)*0.5;
						// that.nodes[i].y = (that.nodes[i].y + that.nodes[j].y)*0.5;
						return <PlanarNode>that.mergeNodes(that.nodes[i], that.nodes[j]);
					}
				}
			}
			return undefined;
		}

		if(epsilon === undefined){ epsilon = EPSILON; }
		var node:PlanarNode;
		var locations:XY[] = [];
		do{
			node = searchAndMergeOneDuplicatePair(epsilon);
			if(node != undefined){ locations.push(new XY(node.x, node.y)); }
		} while(node != undefined)
		var report = new PlanarCleanReport();
		report.nodes.duplicate = locations;
		return report;
	}

	/** Removes circular and duplicate edges, merges and removes duplicate nodes, and refreshes .index values
	 * @returns {object} 'edges' the number of edges removed, and 'nodes' an XY location for every duplicate node merging
	 */
	clean(epsilon?:number):PlanarCleanReport{
		var report = new PlanarCleanReport();
		report.join( this.cleanDuplicateNodes(epsilon) );
		report.join( this.fragment() );
		report.join( this.cleanDuplicateNodes(epsilon) );
		report.join( this.cleanGraph() );
		report.join( this.cleanAllUselessNodes() );
		return report;
	}

	///////////////////////////////////////////////////////////////
	// fragment, EDGE INTERSECTION

	/** Fragment looks at every edge and one by one removes 2 crossing edges and replaces them with a node at their intersection and 4 edges connecting their original endpoints to the intersection.
	 * @returns {XY[]} array of XY locations of all the intersection locations
	 */


// new idea
		// build a N x N matrix of edge to edge relationships, but only use the top triangle
		// fill matrix with approximations

	fragment():PlanarCleanReport{
		var that = this;
		function fragmentOneRound():PlanarCleanReport{
			var roundReport = new PlanarCleanReport();
			for(var i = 0; i < that.edges.length; i++){
				var fragmentReport = that.fragmentEdge(that.edges[i]);
				roundReport.join(fragmentReport);
				if(fragmentReport.nodes.fragment.length > 0){
					roundReport.join( that.cleanGraph() );
					roundReport.join( that.cleanAllUselessNodes() );
					roundReport.join( that.cleanDuplicateNodes() );
				}
			}
			return roundReport;
		}

		//todo: remove protection, or bake it into the class itself
		var protection = 0;
		var report = new PlanarCleanReport();
		var thisReport:PlanarCleanReport;
		do{
			thisReport = fragmentOneRound();
			report.join( thisReport );
			protection += 1;
		}while(thisReport.nodes.fragment.length != 0 && protection < 400);
		if(protection >= 400){ console.log("breaking loop, exceeded 400"); }
		return report;
	}

	/** This function targets a single edge and performs the fragment operation on all crossing edges.
	 * @returns {XY[]} array of XY locations of all the intersection locations
	 */
	fragmentEdge(edge:PlanarEdge):PlanarCleanReport{
		var report = new PlanarCleanReport();
		var intersections:EdgeIntersection[] = edge.crossingEdges();
		if(intersections.length === 0) { return report; }
		report.nodes.fragment = intersections.map(function(el){ return new XY(el.x, el.y);});
		var endNodes = edge.nodes.sort(function(a,b){
			if(a.x-b.x < -EPSILON_HIGH){ return -1; }  if(a.x-b.x > EPSILON_HIGH){ return 1; }
			if(a.y-b.y < -EPSILON_HIGH){ return -1; }  if(a.y-b.y > EPSILON_HIGH){ return 1; }
			return 0;
		});
		// iterate through intersections, rebuild edges in order
		var newLineNodes = [];
		// todo, add endNodes into this array
		for(var i = 0; i < intersections.length; i++){
			if(intersections[i] != undefined){
				var newNode = (<PlanarNode>this.newNode()).position(intersections[i].x, intersections[i].y);
				this.copyEdge(intersections[i].edge).nodes = [newNode, intersections[i].edge.nodes[1]];
				intersections[i].edge.nodes[1] = newNode;
				newLineNodes.push(newNode);
			}
		}
		// replace the original edge with smaller collinear pieces of itself
		this.copyEdge(edge).nodes = [endNodes[0], newLineNodes[0]];
		for(var i = 0; i < newLineNodes.length-1; i++){
			this.copyEdge(edge).nodes = [newLineNodes[i], newLineNodes[i+1]];
		}
		this.copyEdge(edge).nodes = [newLineNodes[newLineNodes.length-1], endNodes[1]];
		this.removeEdge(edge);
		report.join(this.cleanGraph());
		return report;
	}

	///////////////////////////////////////////////
	// GET PARTS
	///////////////////////////////////////////////

	/** Without changing the graph, this function collects the XY locations of every point that two edges cross each other.
	 * @returns {XY[]} array of XY locations of all the intersection locations
	 */
	getEdgeIntersections():XY[]{
		// todo should this make new XYs instead of returning EdgeIntersection objects?
		var intersections = [];
		// check all edges against each other for intersections
		for(var i = 0; i < this.edges.length-1; i++){
			for(var j = i+1; j < this.edges.length; j++){
				var intersection = this.edges[i].intersection(this.edges[j]);
				// add to array if exists, and is unique
				if(intersection != undefined){
					var copy = false;
					for(var k = 0; k < intersections.length; k++){
						if(intersection.equivalent(intersections[k])){ copy = true;}
					}
					if(!copy){ intersections.push(intersection); }
				}
			}
		}
		return intersections;
	}

	/** Add an already-initialized edge to the graph
	 * @param {XY} either two numbers (x,y) or one XY point object (XY)
	 * @returns {PlanarNode} nearest node to the point
	 */
	getNearestNode(x:any, y:any):PlanarNode{
		// input x is an xy point
		if(isValidPoint(x)){ y = x.y; x = x.x; }
		if(typeof(x) !== 'number' || typeof(y) !== 'number'){ return; }
		// can be optimized with a k-d tree
		var node = undefined;
		var distance = Infinity;
		for(var i = 0; i < this.nodes.length; i++){
			var dist = Math.sqrt(Math.pow(this.nodes[i].x - x,2) + Math.pow(this.nodes[i].y - y,2));
			if(dist < distance){
				distance = dist;
				node = this.nodes[i];
			}
		}
		return node;
	}

	getNearestNodes(x:any, y:any, howMany:number):PlanarNode[]{
		// input x is an xy point
		if(isValidPoint(x)){ y = x.y; x = x.x; }
		if(typeof(x) !== 'number' || typeof(y) !== 'number'){ return; }
		// can be optimized with a k-d tree
		var distances = [];
		for(var i = 0; i < this.nodes.length; i++){
			var dist = Math.sqrt(Math.pow(this.nodes[i].x - x,2) + Math.pow(this.nodes[i].y - y,2));
			distances.push( {'i':i, 'd':dist} );
		}
		distances.sort(function(a,b) {return (a.d > b.d) ? 1 : ((b.d > a.d) ? -1 : 0);} ); 
		// cap howMany at the number of total nodes
		if(howMany > distances.length){ howMany = distances.length; }
		return distances.slice(0, howMany).map(function(el){ return this.nodes[el.i]; }, this);
	}

	getNearestEdge(x:any, y:any):EdgeIntersection{
		// input x is an xy point
		if(isValidPoint(x)){ y = x.y; x = x.x; }
		if(typeof(x) !== 'number' || typeof(y) !== 'number'){ return; }
		var minDist, nearestEdge, minLocation = {x:undefined, y:undefined};
		for(var i = 0; i < this.edges.length; i++){
			var p = this.edges[i].nodes;
			var pT = minDistBetweenPointLine(p[0], p[1], x, y);
			if(pT != undefined){
				var thisDist = Math.sqrt(Math.pow(x-pT.x,2) + Math.pow(y-pT.y,2));
				if(minDist == undefined || thisDist < minDist){
					minDist = thisDist;
					nearestEdge = this.edges[i];
					minLocation = pT;
				}
			}
		}
		// for (x,y) that is not orthogonal to the length of the edge (past the endpoint)
		// check distance to node endpoints
		for(var i = 0; i < this.nodes.length; i++){
			var dist = Math.sqrt(Math.pow(this.nodes[i].x - x,2) + Math.pow(this.nodes[i].y - y,2));
			if(dist < minDist){
				var adjEdges = this.nodes[i].adjacentEdges();
				if(adjEdges != undefined && adjEdges.length > 0){
					minDist = dist;
					nearestEdge = adjEdges[0];
					minLocation = {x:this.nodes[i].x, y:this.nodes[i].y};
				}
			}
		}
		return new EdgeIntersection(nearestEdge, minLocation.x, minLocation.y);
	}

	getNearestEdges(x:any, y:any, howMany:number):any[]{
		// input x is an xy point
		if(isValidPoint(x)){ y = x.y; x = x.x; }
		if(typeof(x) !== 'number' || typeof(y) !== 'number'){ return; }
		var minDist, nearestEdge, minLocation = {x:undefined, y:undefined};
		var edges = this.edges.map(function(el){ 
			var pT = minDistBetweenPointLine(el.nodes[0], el.nodes[1], x, y);
			if(pT === undefined) return undefined;
			var distances = [
				Math.sqrt(Math.pow(x-pT.x,2) + Math.pow(y-pT.y,2)), // perp dist
				Math.sqrt(Math.pow(el.nodes[0].x - x, 2) + Math.pow(el.nodes[0].y - y, 2)), // node 1 dist
				Math.sqrt(Math.pow(el.nodes[1].x - x, 2) + Math.pow(el.nodes[1].y - y, 2)), // node 2 dist
			].filter(function(el){return el !== undefined; })
			 .sort(function(a,b){return (a > b)?1:(a < b)?-1:0});
			if(distances.length){ return {'edge':el, 'distance':distances[0]}; }			
		});
		return edges.filter(function(el){return el != undefined; });
	}

	getNearestInteriorAngle(x:any, y:any):InteriorAngle{
		// input x is an xy point
		if(isValidPoint(x)){ y = x.y; x = x.x; }
		if(typeof(x) !== 'number' || typeof(y) !== 'number'){ return; }
		// var node = this.getNearestNode(x,y);
		// var angles = node.interiorAngles();
		var nodes = this.getNearestNodes(x,y,5);
		var node, angles;
		for(var i = 0; i < nodes.length; i++){
			node = nodes[i];
			angles = node.interiorAngles();
			if(angles !== undefined && angles.length > 0){ break; }
		}
		if(angles == undefined || angles.length === 0){ return undefined; }
		// cross product on each edge pair
		var anglesInside = angles.filter(function(el){ 
			var pt0 = <PlanarNode>el.edges[0].uncommonNodeWithEdge(el.edges[1]);
			var pt1 = <PlanarNode>el.edges[1].uncommonNodeWithEdge(el.edges[0]);
			var cross0 = (y - node.y) * (pt1.x - node.x) - 
						 (x - node.x) * (pt1.y - node.y);
			var cross1 = (y - pt0.y) * (node.x - pt0.x) - 
						 (x - pt0.x) * (node.y - pt0.y);
			if (cross0 < 0 || cross1 < 0){ return false; }
			return true;
		});
		if(anglesInside.length > 0) return anglesInside[0];
		return undefined;
	}

	///////////////////////////////////////////////////////////////
	// CALCULATIONS

	// interiorAngle3Nodes(centerNode:PlanarNode, node1:PlanarNode, node2:PlanarNode):number{
	// 	var adjacentEdges = centerNode.planarAdjacent();
	// 	console.log(adjacentEdges);
	// 	return 0;
	// }

	nodeNormals(){

	}

	nodeTangents(){
		// var nodes2Edges = this.nodes.map()
	}

	///////////////////////////////////////////////////////////////
	// FACE

	faceArrayDidChange(){for(var i=0; i<this.faces.length; i++){this.faces[i].index=i;}}

	generateFaces():PlanarFace[]{
		this.faces = [];
		for(var i = 0; i < this.nodes.length; i++){
			var adjacentFaces = this.nodes[i].adjacentFaces();
			for(var af = 0; af < adjacentFaces.length; af++){
				var duplicate = false;
				for(var tf = 0; tf < this.faces.length; tf++){
					if(this.faces[tf].equivalent(adjacentFaces[af])){ duplicate = true; break; }
				}
				if(!duplicate){ this.faces.push(adjacentFaces[af]); }
			}
		}
		this.faceArrayDidChange();
		return this.faces;
	}

	findClockwiseCircut(node1:PlanarNode, node2:PlanarNode):AdjacentNodes[]{
		var incidentEdge = <PlanarEdge>this.getEdgeConnectingNodes(node1, node2);
		if(incidentEdge == undefined) { return undefined; }  // nodes are not adjacent
		var pairs:AdjacentNodes[] = [];
		var lastNode = node1;
		var travelingNode = node2;
		var visitedList = [lastNode];
		var nextWalk = new AdjacentNodes(lastNode, travelingNode, incidentEdge);
		pairs.push(nextWalk);
		do{
			visitedList.push(travelingNode);
			nextWalk = travelingNode.adjacentNodeClockwiseFrom(lastNode);
			pairs.push(nextWalk);
			lastNode = travelingNode;
			travelingNode = nextWalk.node;
			if(travelingNode === node1){ return pairs; }
		} while(!arrayContainsObject(visitedList, travelingNode));
		return undefined;
	}

	makeFace(circut:AdjacentNodes[]):PlanarFace{
		if(circut == undefined || circut.length < 3) return undefined;
		var face = new PlanarFace(this);
		face.nodes = circut.map(function(el){return el.node;});
		// so the first node is already present, it's just in the last spot. is this okay?
		// face.nodes.unshift(circut[0].parent);
		face.edges = circut.map(function(el){return el.edge;});
		for(var i = 0; i < circut.length; i++){
			face.angles.push(clockwiseAngleFrom(circut[i].angle, circut[(i+1)%(circut.length)].angle-Math.PI));
		}
		var angleSum = face.angles.reduce(function(sum,value){ return sum + value; }, 0);
		// sum of interior angles rule, (n-2) * PI
		if(face.nodes.length > 2 && epsilonEqual(angleSum/(face.nodes.length-2), Math.PI, EPSILON)){
			return face;
		}
	}

	adjacentFaceTree(start:PlanarFace):any{
		this.faceArrayDidChange();
		// this will keep track of faces still needing to be visited
		var faceRanks = [];
		for(var i = 0; i < this.faces.length; i++){ faceRanks.push(undefined); }
		function allFacesRanked():boolean{
			for(var i = 0; i < faceRanks.length; i++){
				if(faceRanks[i] === undefined){ return false; }
			}
			return true;
		}

		var rank = [];
		var rankI = 0;
		rank.push([start]);
		// rank 0 is an array of 1 face, the start face
		faceRanks[start.index] = {rank:0, parents:[], face:start};

		// loop
		var safety = 0;
		while(!allFacesRanked() && safety < this.faces.length+1){
			rankI += 1;
			rank[rankI] = [];
			for(var p = 0; p < rank[rankI-1].length; p++){
				var adjacent:PlanarFace[] = rank[rankI-1][p].edgeAdjacentFaces();
				for(var i = 0; i < adjacent.length; i++){
					// add a face if it hasn't already been found
					if(faceRanks[adjacent[i].index] === undefined){
						rank[rankI].push(adjacent[i]);
						var parentArray = faceRanks[ rank[rankI-1][p].index ].parents.slice();
						// add nearest parent to beginning of array
						parentArray.unshift( rank[rankI-1][p] );
						// OR, add them to the beginning
						// parentArray.push( rank[rankI-1][p] );
						faceRanks[adjacent[i].index] = {rank:rankI, parents:parentArray, face:adjacent[i]};
					}
				}
			}
			safety++;
		}
		// console.log(faceRanks);
		// console.log(rank);
		for(var i = 0; i < faceRanks.length; i++){
			if(faceRanks[i] !== undefined && faceRanks[i].parents !== undefined && faceRanks[i].parents.length > 0){
				var parent = <PlanarFace>faceRanks[i].parents[0];
				var edge = <PlanarEdge>parent.commonEdge(faceRanks[i].face);
				var m = edge.reflectionMatrix();
				faceRanks[i].matrix = m;
			}
		}
		for(var i = 0; i < rank.length; i++){
			for(var j = 0; j < rank[i].length; j++){
				var parents = <PlanarFace[]>faceRanks[ rank[i][j].index ].parents;
				var matrix = faceRanks[ rank[i][j].index ].matrix;
				if(parents !== undefined && m !== undefined && parents.length > 0){
					var parentGlobal = faceRanks[ parents[0].index ].global;
					// console.log( faceRanks[ parents[0].index ].global );
					if(parentGlobal !== undefined){
						// faceRanks[ rank[i][j].index ].global = matrix.mult(parentGlobal.copy());
						faceRanks[ rank[i][j].index ].global = parentGlobal.copy().mult(matrix);
					} else{
						faceRanks[ rank[i][j].index ].global = matrix.copy();
					}
					// console.log("done, adding it to global");
				} else{
					faceRanks[ rank[i][j].index ].matrix = new Matrix();
					faceRanks[ rank[i][j].index ].global = new Matrix();
				}
			}
		}
		return {rank:rank, faces:faceRanks};
	}

	///////////////////////////////////////////////////////////////////////

	log(verbose?:boolean){
		console.log('#Nodes: ' + this.nodes.length);
		console.log('#Edges: ' + this.edges.length);
		if(verbose != undefined && verbose == true){
			for(var i = 0; i < this.edges.length; i++){
				console.log(i+': '+ this.edges[i].nodes[0] + ' ' + this.edges[i].nodes[1]);
			}
		}
		for(var i = 0; i < this.nodes.length; i++){
			console.log(' ' + i + ': (' + this.nodes[i].x + ', ' + this.nodes[i].y + ')');
		}
		for(var i = 0; i < this.edges.length; i++){
			console.log(' ' + i + ': (' + this.edges[i].nodes[0].index + ' -- ' + this.edges[i].nodes[1].index + ')');
		}
	}

	///////////////////////////////////////////////////////////////////////
	// delete?
	edgeExistsThroughPoints(a:XY, b:XY):boolean{
		for(var i = 0; i < this.edges.length; i++){
				console.log(a);
				console.log(this.edges[i].nodes[0]);
			if( (a.equivalent(this.edges[i].nodes[0]) && b.equivalent(this.edges[i].nodes[1])) || 
				(a.equivalent(this.edges[i].nodes[1]) && b.equivalent(this.edges[i].nodes[0])) ){
				return true;
			}
		}
		return false;
	}
}
