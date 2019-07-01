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
    //console.log('scaling update');
    //this.marker_width = this.size/scaleX;
    //this.marker_height = this.size/scaleY;
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
    //console.log(viewer.scene.scaleX);
    //console.log(viewer.scene.scaleY);
    viewer.addObject(this.marker);
    viewer.addObject(this.markerText);
  }
} 

//let markers = [];

function init() {
  // Connect to ROS.
  var ros = new ROSLIB.Ros({
    url : 'ws://olorin.engr.oregonstate.edu:9090'
  });

  //var nav_topic = new ROSLIB.Topic({
  //  ros : ros,
  //  name : '/move_base_simple/goal',
  //  messageType : 'geometry_msgs/PoseStamped'
  //});

  //var nav_goal_topic = new ROSLIB.Topic({
  //  ros : ros,
  //  name : '/move_base/current_goal',
  //  messageType : 'geometry_msgs/PoseStamped'
  //});
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
    // for(let m of markers) {
    //   m.updateScaling(viewer.scene.scaleX, viewer.scene.scaleY);
    // }
  });

  agents_srv.callService(new ROSLIB.ServiceRequest({}), function(result) {
    console.log('Result for service call on ' + agents_srv.name);
    var agents = result.agents;
    for(let a of agents) {
      console.log(a);
      let marker = new RobotMarker(a.agent_name, 'red', 0.5);
      marker.addMarker(viewer);

      var robot_pose_topic = new ROSLIB.Topic({
        ros : ros,
        name : '/'+a.agent_name+'/robot_pose',
        messageType : 'geometry_msgs/PoseStamped'
      });

      robot_pose_topic.subscribe(function(msg) {
        marker.setLocation(msg.pose.position.x, -msg.pose.position.y);
      });
    }
  });

  //var marker = new ROS2D.NavigationArrow({size:0.3, strokeSize:0.01});
  //var dot_graphic = new createjs.Graphics();
  //dot_graphic.setStrokeStyle(1);
  //dot_graphic.beginFill(createjs.Graphics.getRGB(255,0,0));
  //dot_graphic.drawEllipse(-marker_width/2,-marker_height/2,marker_width,marker_height);

  //var marker = new createjs.Shape(dot_graphic);
  //var marker_label = new createjs.Text('test', '12px Arial', 'red');

  //viewer.addObject(marker);
  //viewer.addObject(marker_label);

  //console.log("creating TFClient");
  //var tfClient = new ROSLIB.TFClient({
  //  ros : ros,
  //  fixedFrame : '/map',
  //  angularThres : 0.01,
  //  transThres : 0.01
  //});

  //var robot_pose_topic = new ROSLIB.Topic({
  //  ros : ros,
  //  name : '/fetch/robot_pose',
  //  messageType : 'geometry_msgs/PoseStamped'
  //});

  //robot_pose_topic.subscribe(function(msg) {
  //  //console.log(msg);
  //  marker.setLocation(msg.pose.position.x, -msg.pose.position.y);
  //});

  //tfClient.subscribe('base_link', function(tf) {
  //  console.log(tf);
  //  marker.setLocation(tf.translation.x, -tf.translation.y);
  //  //marker.x = tf.translation.x;
  //  //marker.y = -tf.translation.y;
  //  //marker.rotation = -180.0 / Math.PI * Math.atan2(2*tf.rotation.w*tf.rotation.z, 1-2*tf.rotation.z*tf.rotation.z);
  //  //marker_label.x = tf.translation.x;
  //  //marker_label.y = -tf.translation.y;
  //  //console.log(marker_label.x);
  //  //console.log(marker_label.y);
  //  //var bounds = marker_label.getBounds();
  //  //console.log(bounds);
  //  //bounds = marker_label.getTransformedBounds();
  //  //console.log(bounds);
  //  //marker_label.setTransform(marker_label.x, marker_label.y, 0.1, 0.1);
  //  //bounds = marker_label.getTransformedBounds();
  //  //marker_label.setTransform(marker_label.x-bounds.width/2, marker_label.y-bounds.height, 0.1, 0.1);
  //  //console.log(bounds);
  //  //console.log(marker_label.x);
  //  //console.log(marker_label.y);
  //});

  //var nav_goal = null;
  //var nav_marker_width=0;
  //var nav_marker_height=0;

  //function showNavGoal(msg) {
  //  console.log(msg);
  //  x_offset = gridClient.currentGrid.pose.position.x;
  //  y_offset = gridClient.currentGrid.pose.position.y;
  //  //console.log(gridClient.currentGrid.pose);
  //  //console.log('Pixel Coordinates');
  //  //console.log(evt.stageX + ', ' + evt.stageY);
  //  //console.log('Scaled Coordinates');
  //  //console.log(evt.stageX/viewer.scene.scaleX + ', ' + evt.stageY/viewer.scene.scaleY);
  //  //console.log('Offset');
  //  //console.log(x_offset + ', ' + y_offset);
  //  x_click_map = evt.stageX/viewer.scene.scaleX+x_offset;
  //  y_click_map = evt.stageY/viewer.scene.scaleY+y_offset;
  //  //console.log('Transformed click coordinates');
  //  console.log(x_click_map + ', ' +  y_click_map);
  //  if(nav_goal == null) {
  //    var dot_graphic = new createjs.Graphics();
  //    dot_graphic.setStrokeStyle(1);
  //    dot_graphic.beginFill(createjs.Graphics.getRGB(0,255,0));
  //    nav_marker_width = 20/viewer.scene.scaleX;
  //    nav_marker_height = 20/viewer.scene.scaleY;
  //    dot_graphic.drawEllipse(-nav_marker_width/2,-nav_marker_height/2,nav_marker_width,nav_marker_height);
  //    nav_goal = new createjs.Shape(dot_graphic);
  //    viewer.addObject(nav_goal);
  //  }
  //}

  //nav_goal_topic.subscribe(showNavGoal);

  //var s = null;
  //var marker_width=0;
  //var marker_height=0;

  //function handleClick(evt) {
  //  console.log(evt);
  //  x_offset = gridClient.currentGrid.pose.position.x;
  //  y_offset = gridClient.currentGrid.pose.position.y;
  //  //console.log(gridClient.currentGrid.pose);
  //  //console.log('Pixel Coordinates');
  //  //console.log(evt.stageX + ', ' + evt.stageY);
  //  //console.log('Scaled Coordinates');
  //  //console.log(evt.stageX/viewer.scene.scaleX + ', ' + evt.stageY/viewer.scene.scaleY);
  //  //console.log('Offset');
  //  //console.log(x_offset + ', ' + y_offset);
  //  x_click_map = evt.stageX/viewer.scene.scaleX+x_offset;
  //  y_click_map = evt.stageY/viewer.scene.scaleY+y_offset;
  //  //console.log('Transformed click coordinates');
  //  console.log(x_click_map + ', ' +  y_click_map);

  //  if(s == null) {
  //    var dot_graphic = new createjs.Graphics();
  //    dot_graphic.setStrokeStyle(1);
  //    dot_graphic.beginFill(createjs.Graphics.getRGB(0,0,255));
  //    marker_width = 10/viewer.scene.scaleX;
  //    marker_height = 10/viewer.scene.scaleY;
  //    dot_graphic.drawEllipse(-marker_width/2,-marker_height/2,marker_width,marker_height);
  //    s = new createjs.Shape(dot_graphic);
  //    viewer.addObject(s);
  //  }
  //  s.x = x_click_map;
  //  s.y = y_click_map;

  //  nav_topic.publish(new ROSLIB.Message({
  //    header: {
  //      frame_id: 'map'
  //    },
  //    pose: {
  //      position: {
  //        x: x_click_map,
  //        y: -y_click_map,
  //        z: 0.0
  //      },
  //      orientation: {
  //        x: 0.0,
  //        y: 0.0,
  //        z: 0.0,
  //        w: 1.0
  //      }
  //    }
  //  }));
  //}

  //viewer.scene.on("stagemousedown", handleClick);
}
