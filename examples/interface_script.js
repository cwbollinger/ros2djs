
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.markers = [];

class LabeledMarker {
    constructor(name, color, size=1) {
        this.name = name;
        this.color = color;
        this.size = size;
        this.marker_width = size;
        this.marker_height = size;
        this.scalingFactor = 0.06*size;
        this.marker = new createjs.Shape();
        this.marker.name = this.name; // for debugging
        this.markerText = new createjs.Text(this.name, '12px Arial', this.color);
    }
  
    updateScaling(scaleX, scaleY) {
        //console.log('Scale:');
        //console.log(scaleX, scaleY);
        this.marker_width = this.size;
        this.marker_height = this.size;
        this.marker.graphics.clear();
        this.marker.graphics.setStrokeStyle(1).beginFill(this.color).drawEllipse(-this.marker_width/2,-this.marker_height/2,this.marker_width,this.marker_height);
        let bounds = this.markerText.getBounds();
        this.markerText.setTransform(this.markerText.x-this.scalingFactor*bounds.width/2, this.markerText.y-this.scalingFactor*bounds.height, this.scalingFactor, this.scalingFactor);
    }
  
    setLocation(x, y, theta=0) {
        //console.log(this.name + ' location: ' + x + ', ' + y);
        this.marker.x = x;
        this.marker.y = y;
        this.marker.rotation = theta;
        let bounds = this.markerText.getTransformedBounds();
        this.markerText.setTransform(x-bounds.width/2, y-this.marker_height/2-bounds.height, this.scalingFactor, this.scalingFactor);
    }
  
    addMarker(viewer) {
        window.markers.push(this);
        this.updateScaling(viewer.scene.scaleX, viewer.scene.scaleY);
        viewer.addObject(this.marker);
        viewer.addObject(this.markerText);
    }
} 

class RobotVisualizer {
    constructor(prefixName, ros, color='black', ns = true) {
        this.prefixName = prefixName
        if(ns) {
            prefixName = '';
        }
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
        this.pose_marker = new LabeledMarker(this.prefixName, color, 0.5);

        console.log("creating TFClient for "+this.prefixName);
        let tfClient = new ROSLIB.TFClient({
            ros : ros,
            serverName : prefixName + '/tf2_web_republisher',
            repubServiceName : prefixName + '/republish_tfs',
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
function showNavGoal(msg) {
    //console.log('Message Position:');
    //console.log(msg.pose.position);
    if(nav_marker == null) {
        nav_marker = new LabeledMarker('goal', 'green', 0.25);
        nav_marker.addMarker(window.viewer);
    }
    nav_marker.setLocation(msg.pose.position.x, -msg.pose.position.y);
}

function initMap() {
    // Connect to ROS.
    window.ros = window.ros || new ROSLIB.Ros({
        url : 'ws://localhost:9090'
    });
  
    // Create the main viewer.
    let mapDiv = document.getElementById('map');
    //console.log(mapDiv);
    //console.log(mapDiv.offsetWidth);
    window.viewer = window.viewer || new ROS2D.Viewer({
        divID : 'map',
        width : mapDiv.offsetWidth,
        height : 600
    });
  
    // Setup the map client.
    if(!window.gridClient) {
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
    }
  
    /*
    function handleClick(evt) {
        map_point = window.viewer.scene.globalToLocal(evt.stageX, evt.stageY);
        window['robot'+window.current_robot].nav_topic.publish(new ROSLIB.Message({
            header: {
                frame_id: 'map'
            },
            pose: {
                position: {
                    x: map_point.x,
                    y: -map_point.y,
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
    */
}

async function setupMap() {
    initMap();
    console.log('init complete');
    await sleep(100);

    console.log('fetching current clients');
    let getAgentsClient = new ROSLIB.Service({
        'ros': window.ros,
        'name': '/task_server/get_agents',
        'serviceType': '/long_term_deplyment/GetRegisteredAgents'
    });

    let request = new ROSLIB.ServiceRequest({});
    getAgentsClient.callService(request, function(result) {
        console.log('spawning markers');
        let agent_names = result.agents.map(x => x.agent_name);
        let multi_robot = false;
        if(agent_names.length > 1) {
            multi_robot = true;
        }
        console.log(agent_names);
	var robot;
        for(let idx = 0; idx < agent_names.length; idx++) {
            if(!multi_robot) {
                robot = new RobotVisualizer('', window.ros, 'black');
            } else {
                robot = new RobotVisualizer(agent_names[idx], window.ros, 'black');
            }
            robot.pose_marker.addMarker(window.viewer);
        }
    });

    /*
    let robot0 = new RobotVisualizer('robot_0', window.ros, 'black');
    robot0.pose_marker.addMarker(window.viewer);
    let robot1 = new RobotVisualizer('robot_1', window.ros, 'red');
    robot1.pose_marker.addMarker(window.viewer);
    window.current_robot = 0;
    */
}

//$(document).ready(setupMap()); // fire off code when ready
