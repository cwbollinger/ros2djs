
/**
 * Setup all visualization elements when the page is loaded.
 */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.viewer = null;
window.markers = [];

class LabeledMarker {
  constructor(name, color, size=1) {
    this.name = name;
    this.color = color;
    this.size = size;
    this.marker_width = size;
    this.marker_height = size;
    this.scalingFactor = 0.1;
    this.marker = new createjs.Shape();
    this.marker.name = this.name; // for debugging
    //this.markerText = new createjs.Text(this.name, '12px Arial', this.color);
  }

  updateScaling(scaleX, scaleY) {
    //console.log(scaleX, scaleY);
    this.marker_width = this.size/scaleX;
    this.marker_height = this.size/scaleY;
    this.marker.graphics.clear();
    this.marker.graphics.setStrokeStyle(1).beginFill(this.color).drawEllipse(-this.marker_width/2,-this.marker_height/2,this.marker_width,this.marker_height);
    //let bounds = this.markerText.getBounds();
    //this.markerText.setTransform(this.markerText.x-this.scalingFactor*bounds.width/2, this.markerText.y-this.scalingFactor*bounds.height, this.scalingFactor, this.scalingFactor);
  }

  setLocation(x, y, theta=0) {
    //console.log(this.name + ' location: ' + x + ', ' + y);
    this.marker.x = x;
    this.marker.y = y;
    this.marker.rotation = theta;
    //console.log(window.viewer.scene.getChildIndex(window.gridClient.currentGrid));
    //console.log(window.viewer.scene.getChildIndex(window.robot0.pose_marker.marker));
    //let bounds = this.markerText.getTransformedBounds();
    //this.markerText.setTransform(x-bounds.width/2, y-bounds.height, this.scalingFactor, this.scalingFactor);
  }

  addMarker(viewer) {
    //window.markers.push(this);
    this.updateScaling(viewer.scene.scaleX, viewer.scene.scaleY);
    viewer.addObject(this.marker);
    viewer.addObject(this.markerText);
  }
} 

class RobotVisualizer {
  constructor(prefixName, ros, color='black') {
    this.prefixName = prefixName
    this.nav_topic = new ROSLIB.Topic({
      ros : ros,
      name : prefixName+'/move_base_simple/goal',
      messageType : 'geometry_msgs/PoseStamped'
    });

    this.nav_goal_topic = new ROSLIB.Topic({
      ros : ros,
      name : prefixName+'/move_base/current_goal',
      messageType : 'geometry_msgs/PoseStamped'
    });

    this.nav_goal_topic.subscribe(showNavGoal);
    this.pose_marker = new LabeledMarker(prefixName, color, 0.5);

    //console.log("creating TFClient");
    let tfClient = new ROSLIB.TFClient({
      ros : ros,
      fixedFrame : '/map',
      angularThres : 0.01,
      transThres : 0.01
    });

    tfClient.subscribe(prefixName+'/base_link', (tf) => {
      console.log(this.prefixName + ': ' + tf.translation.x + ', ' + -tf.translation.y);
      this.pose_marker.setLocation(tf.translation.x, -tf.translation.y);
    });

  }
}

var nav_marker = null;
const showNavGoal = (msg) => {
  //console.log('Message Position:');
  //console.log(msg.pose.position);
  if(nav_marker == null) {
    nav_marker = new LabeledMarker('goal', 'green', 0.25);
    nav_marker.addMarker(window.viewer);
  }
  nav_marker.setLocation(msg.pose.position.x, -msg.pose.position.y);
}

function init() {
  // Connect to ROS.
  window.ros = new ROSLIB.Ros({
    url : 'ws://olorin.engr.oregonstate.edu:9090'
  });

  // Create the main viewer.
  let mapDiv = document.getElementById('map');
  //console.log(mapDiv);
  //console.log(mapDiv.offsetWidth);
  window.viewer = new ROS2D.Viewer({
    divID : 'map',
    width : mapDiv.offsetWidth,
    height : mapDiv.offsetWidth,
    height : 600
  });

  // Setup the map client.
  window.gridClient = new ROS2D.OccupancyGridClient({
    ros : ros,
    rootObject : window.viewer.scene,
    // Use this property in case of continuous updates			
    continuous: true
  });

  // Scale the canvas to fit to the map
  window.gridClient.on('change', function() {
    window.viewer.scaleToDimensions(window.gridClient.currentGrid.width, window.gridClient.currentGrid.height);
    window.viewer.shift(window.gridClient.currentGrid.pose.position.x, window.gridClient.currentGrid.pose.position.y);
    for(let m of window.markers) {
      m.updateScaling(window.viewer.scene.scaleX, window.viewer.scene.scaleY);
    }
  });

  function transformClickToMap(pixelX, pixelY) {
    x_offset = window.gridClient.currentGrid.pose.position.x;
    y_offset = window.gridClient.currentGrid.pose.position.y;
    //console.log('Pixel Coordinates');
    //console.log(pixelX + ', ' + pixelY);
    x_map = pixelX/window.viewer.scene.scaleX+window.gridClient.currentGrid.x;
    y_map = -1.0*(pixelY/window.viewer.scene.scaleY+window.gridClient.currentGrid.y);
    return [x_map, y_map];
  }

  function handleClick(evt) {
    //console.log(evt);
    map_point = transformClickToMap(evt.stageX, evt.stageY);
    //console.log(map_point[0] + ', ' +  map_point[1]);
    window.robot0.nav_topic.publish(new ROSLIB.Message({
      header: {
        frame_id: 'map'
      },
      pose: {
        position: {
          x: map_point[0],
          y: map_point[1],
          z: 0.0
        },
        orientation: {
          x: 0.0,
          y: 0.0,
          z: 0.0,
          w: 1.0
        }
      }
    }));
  }

  window.viewer.scene.on("stagemousedown", handleClick);
}

async function run() {
  init();
  console.log('init complete');
  //await sleep(100);

  console.log('spawning markers');
  //window.robot1 = new RobotVisualizer('robot_1', window.ros, 'red');
  //window.robot1.pose_marker.addMarker(window.viewer);
  // sanity check
  let foo = new createjs.Shape();
  foo.graphics.setStrokeStyle(1).beginFill('blue').drawCircle(0, 0, 1);
  foo.x = 5;
  foo.y = -5;
  window.viewer.addObject(foo);
  await sleep(500);
  foo.graphics.clear();
  foo.graphics.setStrokeStyle(1).beginFill('red').drawCircle(0, 0, 1);

  let robot0 = new RobotVisualizer('robot_0', window.ros, 'black');
  robot0.pose_marker.addMarker(window.viewer);
}

$(document).ready(run()); // fire off code when ready
