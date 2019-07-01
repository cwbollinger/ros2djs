/**
 * Setup all visualization elements when the page is loaded.
 */

class RobotMarker {
  constructor(robotName, color, size=1) {
    this.name = robotName;
    this.color = color;
    this.size = size;
    this.marker_width = size;
    this.marker_height = size;
    this.graphic = null;
    this.scalingFactor = 0.1;
  }

  updateScaling(scaleX, scaleY) {
    this.marker_width = this.size/1.5;
    this.marker_height = this.size/1.5;
    let graphic = new createjs.Graphics();
    graphic.setStrokeStyle(1);
    graphic.beginFill(createjs.Graphics.getRGB(255,0,0));
    graphic.drawEllipse(-this.marker_width/2,-this.marker_height/2,this.marker_width,this.marker_height);
    this.marker = new createjs.Shape(graphic);
    this.markerText = new createjs.Text(this.name, '12px Arial', this.color);
    let bounds = this.markerText.getBounds();
    this.markerText.setTransform(
      this.markerText.x-this.scalingFactor*bounds.width/2,
      this.markerText.y-this.scalingFactor*bounds.height,
      this.scalingFactor,
      this.scalingFactor
    );
  }

  setLocation(x, y, theta=0) {
    this.marker.x = x;
    this.marker.y = y;
    this.marker.rotation = theta;
    let bounds = this.markerText.getTransformedBounds();
    this.markerText.setTransform(x-bounds.width/2, y-bounds.height, this.scalingFactor, this.scalingFactor);
  }

  addMarker(viewer) {
    this.updateScaling(viewer.scene.scaleX, viewer.scene.scaleY);
    viewer.addObject(this.marker);
    viewer.addObject(this.markerText);
  }
} 

function init() {
  // Connect to ROS.
  var ros = new ROSLIB.Ros({
    url : 'ws://olorin.engr.oregonstate.edu:9090'
  });

  var agents_srv = new ROSLIB.Service({
    ros : ros,
    name : '/task_server/get_agents',
    serviceType : '/long_term_deployment/GetRegisteredAgents'
  });

  // Create the main viewer.
  var viewer = new ROS2D.Viewer({
    divID : 'map',
    width : 600,
    height : 600
  });

  // Setup the map client.
  var gridClient = new ROS2D.OccupancyGridClient({
    ros : ros,
    rootObject : viewer.scene,
    topic: '/maps/graf/map',
    // Use this property in case of continuous updates			
    continuous: true
  });

  // Scale the canvas to fit to the map
  gridClient.on('change', function() {
    console.log('Grid Client Change');
    viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
    viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
  });

  agents_srv.callService(new ROSLIB.ServiceRequest({}), function(result) {
    console.log('Result for service call on ' + agents_srv.name);
    var agents = result.agents;
    for(let a of agents) {
      console.log(a);
      let marker = new RobotMarker(a.agent_name, 'red', 0.5);

      var robot_pose_topic = new ROSLIB.Topic({
        ros : ros,
        name : '/'+a.agent_name+'/robot_pose',
        messageType : 'geometry_msgs/PoseStamped'
      });

      var added = false;
      robot_pose_topic.subscribe(function(msg) {
        if(!added) {
          added = true;
          marker.addMarker(viewer);
	}
        marker.setLocation(msg.pose.position.x, -msg.pose.position.y);
      });
    }
  });
}
