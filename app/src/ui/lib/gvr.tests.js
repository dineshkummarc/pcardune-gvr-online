/*jslint forin: true */

var gvr = gvr;
gvr.tests = {};
(function($){

     $.assert = function(cond){
         if (!cond){
             throw new Error("Assertion failed");
         }
     };

     $.assertEquals = function(actual, expected){
         if (actual !== expected){
             throw new Error("Assertion failed:  Expected "+expected+" but got "+actual+" instead");
         }
     };

     $.assertNotEqual = function(actual, expected){
         if (actual === expected){
             throw new Error("Assertion failed:  Expected "+expected+" !== "+actual);
         }
     };

     $.keysOf = function(obj){
         var keys = [];
         for (key in obj){
             keys.push(key);
         }
         return keys;
     };

     var assert = $.assert;
     var assertEquals = $.assertEquals;
     var assertNotEqual = $.assertNotEqual;
     var keysOf = $.keysOf;

     $.TestWorld = {
         getWorld: function(){
             return gvr.newWorld();
         },
         testConstructor: function testConstructor(){
             var w = gvr.newWorld();
             assertEquals(keysOf(w.walls).length, 0);
             assertEquals(keysOf(w.beepers).length, 0);
             assertEquals(w.robot.x, 1);
             assertEquals(w.robot.y, 1);
         },
         testSetGetBeepers: function testSetGetBeepers(){
             var w = this.getWorld();
             assertEquals(w.getBeepers(5,5), 0);
             w.setBeepers(5,5, 10);
             assertEquals(w.getBeepers(5,5), 10);
         },
         testSetGetWall: function testSetGetWall(){
             var w = this.getWorld();
             assertEquals(w.getWall(5,5, 'NORTH'), false);
             w.setWall(5, 5, 'NORTH');
             assertEquals(w.getWall(5,5, 'NORTH'), true);
         },
         testWorldBoundaryWall: function testWorldBoundaryWall(){
             var w = this.getWorld();
             assertEquals(w.getWall(5,1, 'SOUTH'), true);
             assertEquals(w.getWall(1,5, 'WEST'), true);
         },
         testSetGetMultiWall: function testSetGetMultiWall(){
             var w = this.getWorld();
             w.setWall(7, 7, 'NORTH', 3);
             assertEquals(w.getWall(7,7, 'NORTH'), true);
             assertEquals(w.getWall(8,7, 'NORTH'), true);
             assertEquals(w.getWall(9,7, 'NORTH'), true);
             w.setWall(7, 7, 'SOUTH', 3);
             assertEquals(w.getWall(7,7, 'SOUTH'), true);
             assertEquals(w.getWall(6,7, 'SOUTH'), true);
             assertEquals(w.getWall(5,7, 'SOUTH'), true);
             w.setWall(7, 7, 'EAST', 3);
             assertEquals(w.getWall(7,7, 'EAST'), true);
             assertEquals(w.getWall(7,8, 'EAST'), true);
             assertEquals(w.getWall(7,9, 'EAST'), true);
             w.setWall(7, 7, 'WEST', 3);
             assertEquals(w.getWall(7,7, 'WEST'), true);
             assertEquals(w.getWall(7,6, 'WEST'), true);
             assertEquals(w.getWall(7,5, 'WEST'), true);
         },
         testGetWallCoordinatesNorthSouth: function testGetWallCoordinatesNorthSouth(){
             var w = this.getWorld();
             var coords = w.getWallCoordinates(2, 2, 'NORTH');
             assertEquals(coords.x, 2);
             assertEquals(coords.y, 2);
             assertEquals(coords.direction, 'NORTH');
             var coords2 = w.getWallCoordinates(2, 3, 'SOUTH');
             assertEquals(coords.x, coords2.x);
             assertEquals(coords.y, coords2.y);
             assertEquals(coords.direction, coords2.direction);
         },
         testGetWallCoordinatesEastWest: function testGetWallCoordinatesEastWest(){
             var w = this.getWorld();
             var coords = w.getWallCoordinates(2, 2, 'EAST');
             assertEquals(coords.x, 2);
             assertEquals(coords.y, 2);
             assertEquals(coords.direction, 'EAST');
             var coords2 = w.getWallCoordinates(3, 2, 'WEST');
             assertEquals(coords.x, coords2.x);
             assertEquals(coords.y, coords2.y);
             assertEquals(coords.direction, coords2.direction);
         }
     };


     $.TestRobot = {
         getWorld: function getWorld(){
             return gvr.newWorld();
         },
         testMove: function testMove(){
             var w = this.getWorld();
             assertEquals(w.robot.x, 1);
             assertEquals(w.robot.y, 1);
             assertEquals(w.robot.direction, 'NORTH');
             w.robot.move();
             assertEquals(w.robot.x, 1);
             assertEquals(w.robot.y, 2);
         },
         testMoveFailure: function testMoveFailure(){
             var w = this.getWorld();
             w.robot.front_is_blocked = function(){
                 return true;
             };
             try{
                 w.robot.move();
             } catch (e){
                 assertEquals(e.message, "Ran into a wall");
             }
         },

         testTurnLeft: function testTurnLeft(){
             var w = this.getWorld();
             assertEquals(w.robot.direction, 'NORTH');
             w.robot.turnleft();
             assertEquals(w.robot.direction, 'WEST');
             w.robot.turnleft();
             assertEquals(w.robot.direction, 'SOUTH');
             w.robot.turnleft();
             assertEquals(w.robot.direction, 'EAST');
         },

         testPickBeeper: function testPickBeeper(){
             var w = this.getWorld();
             w.setBeepers(1,1,2);
             assertEquals(w.robot.beepers, 0);
             w.robot.pickbeeper();
             assertEquals(w.robot.beepers, 1);
             assertEquals(w.getBeepers(1,1), 1);
             w.robot.pickbeeper();
             assertEquals(w.getBeepers(1,1), 0);
             try{
                 w.robot.pickbeeper();
             } catch (e){
                 assertEquals(e.message, "No beepers to pick up.");
             }
         },

         testPutBeeper: function testPutBeeper(){
             var w = this.getWorld();
             w.robot.beepers = 2;
             assertEquals(w.robot.beepers, 2);
             assertEquals(w.getBeepers(1,1), 0);
             w.robot.putbeeper();
             assertEquals(w.getBeepers(1,1), 1);
             assertEquals(w.robot.beepers, 1);
             w.robot.putbeeper();
             try{
                 w.robot.putbeeper();
             } catch (e){
                 assertEquals(e.message, "No beepers in beeper bag.");
             }
         },

         testTurnOff: function testTurnOff(){
             var w = this.getWorld();
             assert(w.robot.on);
             w.robot.turnoff();
             assert(!w.robot.on);
             assertEquals($.lastAlert, "Robot turned off");
         },

         testDirectionConditionals: function testDirectionConditionals(){
             var w = this.getWorld();
             assert(w.robot.not_facing_east());
             assert(w.robot.facing_north());
             w.robot.turnleft();
             assert(w.robot.not_facing_north());
             assert(w.robot.facing_west());
             w.robot.turnleft();
             assert(w.robot.not_facing_west());
             assert(w.robot.facing_south());
             w.robot.turnleft();
             assert(w.robot.not_facing_south());
             assert(w.robot.facing_east());
         },

         testBeeperConditions: function testBeeperConditions(){
             var w = this.getWorld();
             assertEquals(w.robot.beepers, 0);
             assert(w.robot.no_beepers_in_beeper_bag());
             w.robot.beepers = 1;
             assert(w.robot.any_beepers_in_beeper_bag());
             assert(w.robot.not_next_to_a_beeper());
             w.robot.putbeeper();
             assert(w.robot.next_to_a_beeper());
         },

         testWallConditions: function testWallConditions(){
             var w = this.getWorld();
             // facing north
             assert(w.robot.front_is_clear());
             w.setWall(1, 1, 'NORTH', 1);
             assert(w.robot.front_is_blocked());
             assert(w.robot.left_is_blocked());
             assert(w.robot.right_is_clear());

             // facing west
             w.robot.turnleft();
             assert(w.robot.front_is_blocked());
             assert(w.robot.left_is_blocked());
             assert(w.robot.right_is_blocked());

             // facing south
             w.robot.turnleft();
             assert(w.robot.front_is_blocked());
             assert(w.robot.left_is_clear());
             assert(w.robot.right_is_blocked());

             //facing east
             w.robot.turnleft();
             assert(w.robot.front_is_clear());
             assert(w.robot.left_is_blocked());
             assert(w.robot.right_is_blocked());
         }
     };

     $.TestWorldParser = {
         getParser: function getParser(lines){
             return gvr.world.parser.newParser(lines, gvr.newWorld());
         },

         testRobot: function testRobot(){
             var parser = this.getParser(['Robot 1 4 E 5']);
             parser.parse();
             assertEquals(parser.world.robot.x, 1);
             assertEquals(parser.world.robot.y, 4);
             assertEquals(parser.world.robot.direction, 'EAST');
             assertEquals(parser.world.robot.beepers, 5);
         },

         testWall: function testWall(){
             var parser = this.getParser(['Wall 1 4 E 4']);
             parser.parse();
             assert(parser.world.getWall(1,4,'EAST'));
             assert(parser.world.getWall(1,5,'EAST'));
             assert(parser.world.getWall(1,6,'EAST'));
             assert(parser.world.getWall(1,7,'EAST'));
             assert(!parser.world.getWall(1,8,'EAST'));
         },

         testBeeper: function testBeeper(){
             var parser = this.getParser(['Beepers 3 3 2']);
             parser.parse();
             assert(parser.world.getBeepers(3,3), 2);
         },

         testComment: function testComment(){
             var parser = this.getParser(['#this is a comment',
                                          'Robot 4 4 N 5 #foo']);
             parser.parse();
             assertEquals(parser.world.robot.x, 4);
             assertEquals(parser.world.robot.y, 4);
             assertEquals(parser.world.robot.beepers, 5);
         }
     };


     /**
      * The gvr.lang module provides provides all the objects need to
      * represent the code path that will be executed.
      */
     $.TestLang = {
         /**
          * The most atomic part of a code execution path is an
          * expression. An expression simply calls a passed in function with a
          * given scope and returns an empty stack (i.e. there is nothing left
          * to do.)
          */
         testExpression: function testExpression(){
             var calledWith;
             var scope = {a: 1};
             function func(){
                 calledWith = this;
             }
             var expression = gvr.lang.newExpression(1, func, scope);
             var next = expression.step();
             assertEquals(calledWith, scope);
             assertEquals(next.length, 0);
         },

         /**
          * In the event that calling the function passed to the
          * expression causes an error to be thrown, the error will be caught
          * and an alert presented to the user.
          */
         testExpressionFailure: function testExpressionFailure(){
             function func(){
                 throw new Error("some error");
             }
             var expression = gvr.lang.newExpression(1, func, {});
             var next = expression.step();
             assertEquals(next, null);
             assertEquals(gvr.tests.lastAlert,"some error");
         },

         /**
          * The next level up after expressions are blocks. These are
          * essentially just a grouping of expression objects.
          */
         testBlock: function testBlock(){
             var log = [];
             var block = new gvr.lang.Block([gvr.lang.newExpression(1, function(){ log.push(1); }, this)]);

             // step over the block once, it will finish
             assertEquals(block.currentStep, 0);
             var next = block.step();
             assertEquals(log[0], 1);
             assertEquals(next.length, 1);
             assertEquals(block.currentStep, 1);

             // if the block is finished, and we step onto it, it will reset.
             next = block.step();
             assertEquals(log[0], 1);
             assertEquals(log.length, 1);
             assertEquals(next.length, 0);
             assertEquals(block.currentStep, 0);

             // now it goes back to the beginning.
             assertEquals(block.currentStep, 0);
             next = block.step();
             assertEquals(log[1], 1);
             assertEquals(next.length, 1);
             assertEquals(block.currentStep, 1);

         },

         testMultiExpressionBlock: function testMultiExpressionBlock(){
             var log = [];
             var block = new gvr.lang.Block(
                 [
                     gvr.lang.newExpression(1, function(){ log.push("one"); }, this),
                     gvr.lang.newExpression(2, function(){ log.push("two"); }, this),
                     gvr.lang.newExpression(3, function(){ log.push("three"); }, this)
                 ]);

             // execute the first step
             assertEquals(block.currentStep, 0);
             var next = block.step();
             assertEquals(log[0], "one");
             assertEquals(next.length, 1);
             assertEquals(next[0], block);
             assertEquals(block.currentStep, 1);

             // execute the second step
             next = block.step();
             assertEquals(log[1], "two");
             assertEquals(next.length, 1);
             assertEquals(next[0], block);
             assertEquals(block.currentStep, 2);

             // execute the third step
             next = block.step();
             assertEquals(log[2], "three");
             assertEquals(next.length, 1);
             assertEquals(block.currentStep, 3);

             // the next time we step on the block, it resets.
             next = block.step();
             assertEquals(log.length, 3);
             assertEquals(next.length, 0);
             assertEquals(block.currentStep, 0);
         },

         testIf: function testIf(){
             var log = [];
             var nextCond = true;
             function condition(){
                 return nextCond;
             }
             var ifExpr = gvr.lang.newIf(1, condition, {}, [gvr.lang.newExpression(2, function(){ log.push("one"); }, this)]);

             assertEquals(ifExpr.block.currentStep, 0);
             var next = ifExpr.step();
             assertEquals(next.length, 1);
             assertEquals(log.length, 1);
             assertEquals(log[0],"one");
             assertEquals(ifExpr.block.currentStep, 1);

             next[0].step();
             assertEquals(ifExpr.block.currentStep, 0);

             next = ifExpr.step();
             assertEquals(log.length, 2);
             next[0].step();

             nextCond = false;
             assertEquals(ifExpr.block.currentStep, 0);
             next = ifExpr.step();
             assertEquals(log.length, 2);
         },

         testElse: function testElse(){
             var log = [];
             var nextCond = true;
             function condition(){
                 return nextCond;
             }
             var ifExpr = gvr.lang.newIf(1, condition, {}, [gvr.lang.newExpression(2, function(){ log.push("one"); }, this)]);
             ifExpr.elseBlock.expressions.push(gvr.lang.newExpression(2, function(){ log.push("two"); }, this));

             assertEquals(ifExpr.block.currentStep, 0);
             var next = ifExpr.step();
             assertEquals(next.length, 1);
             assertEquals(log.length, 1);
             assertEquals(log[0],"one");
             assertEquals(ifExpr.block.currentStep, 1);
             next[0].step();
             assertEquals(ifExpr.block.currentStep, 0);

             nextCond = false;
             assertEquals(ifExpr.elseBlock.currentStep, 0);
             next = ifExpr.step();
             assertEquals(log.length, 2);
             assertEquals(log[1],"two");

             assertEquals(ifExpr.elseBlock.currentStep, 1);
             assertEquals(next.length, 1);
             next[0].step();
             assertEquals(ifExpr.elseBlock.currentStep, 0);
         },

         testElif: function testElif(){
             var log = [];
             var a = true;
             var b = true;
             var c = true;
             var ifExpr = gvr.lang.newIf(          1, function(){return a;}, {}, [
                            gvr.lang.newExpression(2, function(){ log.push("a"); }, this)]);
             ifExpr.elifs.push(
                          gvr.lang.newIf(          3, function(){return b;}, {}, [
                            gvr.lang.newExpression(4, function(){ log.push("b"); }, this)]));
             ifExpr.elifs.push(
                          gvr.lang.newIf(          5, function(){return c;}, {}, [
                            gvr.lang.newExpression(6, function(){ log.push("c"); }, this)]));


             // testing if catch
             assertEquals(ifExpr.block.currentStep, 0);
             var next = ifExpr.step();
             assertEquals(next.length, 1);
             assertEquals(log.length, 1);
             assertEquals(log[0],"a");
             assertEquals(ifExpr.block.currentStep, 1);
             next[0].step();
             assertEquals(ifExpr.block.currentStep, 0);

             // testing first elif catch
             a = false;
             assertEquals(ifExpr.elifs[0].block.currentStep, 0);
             next = ifExpr.step();
             assertEquals(log.length, 2);
             assertEquals(log[1],"b");

             // testing second elif catch
             b = false;
             assertEquals(ifExpr.elifs[1].block.currentStep, 0);
             next = ifExpr.step();
             assertEquals(log.length, 3);
             assertEquals(log[2],"c");

             c = false;
             next = ifExpr.step();
             assertEquals(log.length, 3);
             assertEquals(log[2],"c");


             ifExpr.elseBlock.expressions.push(
                            gvr.lang.newExpression(7, function(){ log.push("else"); }, this));
             // testing else catch
             assertEquals(ifExpr.elseBlock.currentStep, 0);
             next = ifExpr.step();
             assertEquals(log.length, 4);
             assertEquals(log[3],"else");
         }
     };


     $.TestLangParser = {
         getParser: function getParser(lines){
             return gvr.lang.parser.newParser(lines, (gvr.newWorld()).robot);
         },

         testCommand: function testCommand(){
             var block = this.getParser(['move']).parse();
             assertEquals(block.expressions.length, 1);
             assertEquals(block.expressions[0].callable, gvr.newRobot().move);
             assertEquals(block.expressions[0].line, 0);
         },

         testDo: function testDo(){
             var block = this.getParser(['do 3:',
                                         '  move']).parse();
             assertEquals(block.expressions.length, 1);
             assertEquals(block.expressions[0].callable, gvr.newRobot()["do"]);
             assertEquals(block.expressions[0].line, 0);
             assertEquals(block.expressions[0].block.expressions.length, 1);
             assertEquals(block.expressions[0].count, 3);
             assertEquals(block.expressions[0].block.expressions[0].callable, gvr.newRobot().move);
         },

         testIf: function testIf(){
             var block = this.getParser(['if front_is_clear:',
                                         '  move']).parse();
             assertEquals(block.expressions.length, 1);
             assertEquals(block.expressions[0].name, 'if');
             assertEquals(block.expressions[0].callable, gvr.newRobot().front_is_clear);
             assertEquals(block.expressions[0].line, 0);
             assertEquals(block.expressions[0].block.expressions.length, 1);
             assertEquals(block.expressions[0].block.expressions[0].callable, gvr.newRobot().move);
             assertEquals(block.expressions[0].block.expressions[0].line, 1);
         },

         testElse: function testElse(){
             var block = this.getParser(['if front_is_clear:',
                                         '  move',
                                         'else:',
                                         '  turnleft']).parse();
             assertEquals(block.expressions.length, 1);
             assertEquals(block.expressions[0].name, 'if');
             assertEquals(block.expressions[0].callable, gvr.newRobot().front_is_clear);
             assertEquals(block.expressions[0].line, 0);
             assertEquals(block.expressions[0].block.expressions.length, 1);
             assertEquals(block.expressions[0].block.expressions[0].callable, gvr.newRobot().move);
             assertEquals(block.expressions[0].block.expressions[0].line, 1);

             assertEquals(block.expressions[0].elseBlock.expressions.length, 1);
             assertEquals(block.expressions[0].elseBlock.expressions[0].callable, gvr.newRobot().turnleft);
             assertEquals(block.expressions[0].elseBlock.expressions[0].line, 3);
         },

         testElif: function testElif(){
             var block = this.getParser(['if front_is_clear:',
                                         '  move',
                                         'elif facing_north:',
                                         '  putbeeper',
                                         'elif facing_south:',
                                         '  pickbeeper',
                                         'else:',
                                         '  turnleft']).parse();
             assertEquals(block.expressions.length, 1);
             assertEquals(block.expressions[0].elifs.length, 2);
             assertEquals(block.expressions[0].elifs[0].callable, gvr.newRobot().facing_north);
             assertEquals(block.expressions[0].elifs[0].line, 2);
             assertEquals(block.expressions[0].elifs[1].callable, gvr.newRobot().facing_south);
             assertEquals(block.expressions[0].elifs[1].line, 4);
         },

         testWhile: function testWhile(){
             var block = this.getParser(['while front_is_clear:',
                                         '  move']).parse();
             assertEquals(block.expressions.length, 1);
             assertEquals(block.expressions[0].name, 'while');
             assertEquals(block.expressions[0].callable, gvr.newRobot().front_is_clear);
             assertEquals(block.expressions[0].line, 0);
             assertEquals(block.expressions[0].block.expressions.length, 1);
             assertEquals(block.expressions[0].block.expressions[0].callable, gvr.newRobot().move);
             assertEquals(block.expressions[0].block.expressions[0].line, 1);
         },

         testDefine: function testDefine(){
             var block = this.getParser(['define turnright:',
                                         '  do 3:',
                                         '    turnleft']).parse();
             assertEquals(block.expressions.length, 1);
             assertEquals(block.expressions[0].name, 'turnright');
             assertEquals(block.expressions[0].line, 0);
             assertEquals(block.expressions[0].block.expressions.length, 1);
             assertEquals(block.expressions[0].block.expressions[0].line, 1);
             assertEquals(block.expressions[0].block.expressions[0].count, 3);
             assertEquals(block.expressions[0].block.expressions[0].block.expressions[0].callable, gvr.newRobot().turnleft);
         },

         testFunctionCall: function testFunctionCall(){
             var block = this.getParser(['define turnright:',
                                         '  do 3:',
                                         '    turnleft',
                                         'turnright']).parse();
             assertEquals(block.expressions.length, 2);
             assertEquals(block.expressions[1].fname, 'turnright');
         },
         testMultilineBlock: function testMultilineBlock(){
             var block = this.getParser(['while front_is_clear:',
                                         '  move',
                                         '  move',
                                         '  turnleft',
                                         'move']).parse();
             assertEquals(block.expressions.length, 2);
             assertEquals(block.expressions[0].block.expressions.length, 3);
         },
         testSyntaxError: function testSyntaxError(){
             var parser = this.getParser(['do n: move']);
             try{
                 parser.parse();
             } catch (e){
                 assertEquals(e.message, "Syntax Error on line 1: do n: move");
             }
         }
     };
     $.run = function(module){
         gvr.alert = function(message){
             module.lastAlert = message;
         };
         var passed = 0;
         var failed = 0;
         for (item in module){
             if (item.indexOf('Test') === 0){
                 document.body.innerHTML += '<div>'+item+"</div>";
                 for (test in module[item]){
                     if (test.indexOf('test') === 0){
                         try{
                             module[item][test].call(module[item]);
                             document.body.innerHTML += '<div style=\"background: #0f0;\">'+test+" passed</div>";
                             passed++;
                         } catch (e){
                             console.log(e);
                             document.body.innerHTML += '<div style=\"background: #f00;\">'+test+" FAILED:<pre>"+e.stack+"</pre></div>";
                             failed++;
                         }
                     }
                 }
             }
         }
         document.body.innerHTML += '<div>Ran '+(passed+failed)+" tests with "+failed+" failures</div>";
     };

 })(gvr.tests);