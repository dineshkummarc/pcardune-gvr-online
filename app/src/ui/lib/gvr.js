/**
 * @fileOverview This file defines the Robot and World objects.
 * @author Paul Carduner
 */
goog.provide("gvr");
goog.require("gvr.robot");
goog.require("gvr.world");
goog.require("gvr.renderer");
goog.require("gvr.runner");

/**
 * @class Represents a runtime error.  For example, when the robot runs into a wall.
 * @constructor
 */
gvr.RunTimeError = function(message){
    this.message = message;
};

/**
 * Constructs a new robot object.
 * @see gvr.robot.Robot
 * @returns {gvr.robot.Robot}
 */
gvr.newRobot = function(world){
    return new gvr.robot.Robot(world);
};

/**
 * Constructs a new world object.
 * @see gvr.world.World
 * @returns {gvr.world.World}
 */
gvr.newWorld = function(){
    return new gvr.world.World();
};

/**
 * Constructs a new renderer object.
 * @see gvr.world.Renderer
 * @returns {gvr.renderer.Renderer}
 */
gvr.newRenderer = function(canvasEl, world){
    return new gvr.renderer.Renderer(canvasEl, world);
};

/**
 * Constructs a new runner object.
 * @see gvr.runner.Runner
 * @returns {gvr.runner.Runner}
 */
gvr.newRunner = function(program, renderer, notify){
    return new gvr.runner.Runner(program, renderer, notify);
};

