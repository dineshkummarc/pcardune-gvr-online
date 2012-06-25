// borrowed from John Resig's blog post: http://ejohn.org/blog/simple-javascript-inheritance/
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();


////here is an example for using the above code.
//var Person = Class.extend({
//  init: function(isDancing){
//    this.dancing = isDancing;
//  },
//  dance: function(){
//    return this.dancing;
//  }
//});
//
//var Ninja = Person.extend({
//  init: function(){
//    this._super( false );
//  },
//  dance: function(){
//    // Call the inherited version of dance()
//    return this._super();
//  },
//  swingSword: function(){
//    return true;
//  }
//});
//
//var p = new Person(true);
//p.dance(); // => true
//
//var n = new Ninja();
//n.dance(); // => false
//n.swingSword(); // => true
//
//// Should all be true
//p instanceof Person && p instanceof Class && n instanceof Ninja && n instanceof Person && n instanceof Class;


/**
 * @namespace The gvr namespace.  All gvr related code lives in this namespace.
 */
var gvr = {};

/**
 * alert something to the user.  Used instead of default alert function.
 * @param message The message to alert.
 */
gvr.alert = function(message){
    alert(message);
};

/**
 * turn debugging on or off
 * @constant
 */
gvr.DEBUG = false;

/**
 * debug a message only if debugging is turned on.
 * Takes an arbitrary number of parameters.
 */
gvr.debug = function (){
    if (gvr.DEBUG){
        console.log.apply(this, arguments);
    }

};
/**
 * @namespace namespace for everything that has to do with the GvR language
 */
gvr.lang = {};

/**
 * @constant
 */
gvr.lang.RUNNER_GLOBAL_KEY = "$runner";

/**
 * @function
 */
gvr.lang.getRunner = function getRunner(globals){
    globals = globals || {};
    var runner = globals[gvr.lang.RUNNER_GLOBAL_KEY];
    if (!runner){
        /**
         * stubbed out version of {@link gvr.runner.Runner}
         */
        runner = {
            /**
             * @see gvr.runner.Runner#notify
             */
            notify:function(){}
        };
    }
    return runner;
};


gvr.lang.BaseExpression = Class.extend(
    /** @lends gvr.lang.BaseExpression# */
    {

        /**
         * the line number associated with this expression.
         */
        line: null,
        /**
         * the name of this expression. (mostly for debugging)
         */
        name: null,

        /**
         * @class base class used by all other language elements.
         * @constructs
         * @param line the line number associated with this expression.
         * @param name the name of this expression. (mostly for debugging)
         */
        init: function(line, name){
            this.line = line;
            this.name = name;
        }
    }
);

gvr.lang.Expression = gvr.lang.BaseExpression.extend(
    /** @lends gvr.lang.Expression# */
    {

        /**
         * A callable that executes this expression.
         */
        callable: null,
        /**
         * The scope with which to call the callable.
         */
        scope: null,

        /**
         * @class Represents a single expression in the gvr language.
         * @extends gvr.lang.BaseExpression
         * @constructs
         * @param line See {@link gvr.lang.BaseExpression#line}
         * @param callable The callable function that constitutes execution of this expression.
         * @param scope The scope with which to call the callable function.
         */
        init: function(line, callable, scope){
            this._super(line, "expr");
            this.callable = callable;
            this.scope = scope;
        },
        /**
         * Step over this expression.
         * @param globals global values passed throughout program execution.
         */
        step: function(globals){
            gvr.lang.getRunner(globals).notify(this);
            try{
                this.callable.call(this.scope);
                return [];
            } catch (e){
                gvr.alert(e.message);
            }
            return null;
        }
    });

/**
 * Creates a new Expression object.
 * @see gvr.lang.Expression
 * @returns {gvr.lang.Expression}
 */
gvr.lang.newExpression = function(line, callable, scope){
    return new gvr.lang.Expression(line, callable, scope);
};


gvr.lang.Block = Class.extend(
    /** @lends gvr.lang.Block# */
    {
        /**
         * @class Represents an executable grouping of {@link gvr.lang.BaseExpression} objects.
         * @constructs
         * @param expressions A list of {@link gvr.lang.BaseExpression} objects to step over.
         */
        init: function(expressions){
            this.name="block";
            /**
             * A list of expressions that are part of the block
             */
            this.expressions = expressions;
            /**
             * the current step in the block
             */
            this.currentStep = 0;
        },

        /**
         * Step over the next expression in the block.  Once all expressions
         * in the block have been stepped over, the currentStep counter is
         * reset to 0 so the same block instance may be steped over again
         * (for example, when the block is part of a loop).
         * @param globals global values passed throughout program execution.
         */
        step: function(globals){
            var stack = [];
            if (this.currentStep < this.expressions.length){
                stack.push(this);
                var next = this.expressions[this.currentStep].step(globals);
                this.currentStep++;
                stack = stack.concat(next);
            } else {
                this.currentStep = 0;
            }
            return stack;
        }
    });

gvr.lang.If = gvr.lang.BaseExpression.extend(
    /** @lends gvr.lang.If# */
    {
        /**
         * @class Represents an if statement in the gvr language.
         * @extends gvr.lang.BaseExpression
         * @constructs
         * @param line See {@link gvr.lang.BaseExpression#line}
         * @param callable See {@link gvr.lang.If#callable}
         * @param scope See {@link gvr.lang.If#scope}
         * @param expressions A list of expressions with which to
         *                    create a {@link gvr.lang.Block} object
         */
        init: function (line, callable, scope, expressions){
            this._super(line, "if");

            /**
             * The callable that returns a boolean value
             * @type function
             */
            this.callable = callable;

            /**
             * The scope with which to call the callable
             * @type Object
             */
            this.scope = scope;

            /**
             * The block to step into if the callable returns true
             * @type gvr.lang.Block
             */
            this.block = new gvr.lang.Block(expressions);

            /**
             * A list of other elif conditions to try.
             * @type Array
             */
            this.elifs = [];

            /**
             * The block to step into if the callable returns false.
             * @type gvr.lang.Block
             */
            this.elseBlock = new gvr.lang.Block([]);
        },

        /**
         * Step into the appropriate block depending
         * on the return value of {@link gvr.lang.If#callable}.
         * If there {@link gvr.lang.If#elifs} is not empty, and
         * {@link gvr.lang.If#callable} returns false, then all the elifs
         * will be processed.
         * @param globals global values passed throughout program execution.
         */
        step:function (globals){
            gvr.lang.getRunner(globals).notify(this);
            var conditionMatched = false;
            var stack = [];
            if (this.callable.call(this.scope)){
                stack = this.block.step(globals);
                conditionMatched = true;
            } else if (this.elifs.length > 0){
                for (var i=0; i < this.elifs.length; i++){
                    var stackLength = stack.length;
                    stack = this.elifs[i].step(globals);
                    if (stackLength != stack.length){
                        //Stack was changed so we shouldn't fall through anymore.
                        conditionMatched = true;
                        break;
                    }
                }
            }
            if (!conditionMatched && this.elseBlock.expressions.length > 0){
                stack = this.elseBlock.step(globals);
            }
            return stack;
        }
    });

/**
 * creates a new {@link gvr.lang.If} object
 * @returns {gvr.lang.If}
 */
gvr.lang.newIf = function (line, callable, scope, expressions){
    return new gvr.lang.If(line, callable, scope, expressions);
};


gvr.lang.While = gvr.lang.BaseExpression.extend(
    /** @lends gvr.lang.While# */
    {
        /**
         * @class Represents a while loop in the gvr language.
         * @extends gvr.lang.BaseExpression
         * @constructs
         * @param line See {@link gvr.lang.BaseExpression#line}
         * @param callable See {@link gvr.lang.If#callable}
         * @param scope See {@link gvr.lang.If#scope}
         * @param expressions A list of expressions with which to
         *                    create a {@link gvr.lang.Block} object
         */
        init: function(line, callable, scope, expressions){
            this._super(line, "while");
            /** A callable that returns a boolean value. */
            this.callable = callable;
            /** the scope with which to call the callable */
            this.scope = scope;
            /** The block to step into as long as the callable returns true */
            this.block = new gvr.lang.Block(expressions);
        },

        /**
         * Step into the while loop's block
         * as long as {@link gvr.lang.While#callable} returns true
         * @param globals global values passed throughout program execution.
         */
        step: function(globals){
            gvr.lang.getRunner(globals).notify(this);
            var stack = [];
            if (this.callable.call(this.scope)){
                stack.push(this);
                stack = stack.concat(this.block.step(globals));
            }
            return stack;
        }
    });

/**
 * creates a new {@link gvr.lang.While} object
 * @returns {gvr.lang.While}
 */
gvr.lang.newWhile = function(line, callable, scope, expressions){
    return new gvr.lang.While(line, callable, scope, expressions);
};

gvr.lang.Do = gvr.lang.BaseExpression.extend(
    /** @lends gvr.lang.Do# */
    {
        /**
         * @class Represents a do loop in the gvr language.
         * @extends gvr.lang.BaseExpression
         * @constructs
         * @param line See {@link gvr.lang.BaseExpression#line}
         * @param count See {@link gvr.lang.Do#count}
         * @param expressions A list of expressions with which to
         *                    create a {@link gvr.lang.Block} object
         */
        init: function(line, count, expressions){
            this._super(line, "do");

            /**
             * The number of times to step into the block
             * @type int
             */
            this.count = count;

            /**
             * The block to step into after each successive step
             * @type gvr.lang.Block
             */
            this.block = new gvr.lang.Block(expressions);

            /**
             * The current step of the Do expression
             * @type int
             */
            this.currentStep = 0;
        },

        /**
         * Step into the do loop's block
         * up to the number of times specified by {@link gvr.lang.Do#count}.
         * Once the block has been entered this many times, the counter is
         * reset so the process may occur again (for nested loops).
         * @param globals global values passed throughout program execution.
         */
        step:function(globals){
            gvr.lang.getRunner(globals).notify(this);
            var stack = [];
            if (this.currentStep < this.count){
                stack.push(this);
                this.currentStep++;
                stack = stack.concat(this.block.step(globals));
            } else {
                this.currentStep = 0;
            }
            return stack;
        }
    });

/**
 * creates a new {@link gvr.lang.Do} object
 * @returns {gvr.lang.Do}
 */
gvr.lang.newDo = function(line, count, expressions){
    return new gvr.lang.Do(line, count, expressions);
};



gvr.lang.Define = gvr.lang.BaseExpression.extend(
    /** @lends gvr.lang.Define# */
    {
        /**
         * @class Represents a function definition in the gvr language.
         * @extends gvr.lang.BaseExpression
         * @constructs
         * @param name The name of the function.  Should be unique for each definition.
         *             Used by FunctionCall to look up the function.
         * @param line See {@link gvr.lang.BaseExpression#line}
         * @param expressions A list of expressions with which to
         *                    create a {@link gvr.lang.Block} object
         */
        init: function(line, name, expressions){
            this._super(line, name);
            /**
             * The block to step into when this definition is called.
             * @type gvr.lang.Block
             */
            this.block = new gvr.lang.Block(expressions);
        },

        /**
         * Registers the function into the global namespace so it can be accessed
         * by other language objects.
         * @param globals global values passed throughout program execution.
         */
        step:function(globals){
            gvr.lang.getRunner(globals).notify(this);
            globals[this.name] = this;
            return [];
        }
    }
);

/**
 * creates a new {@link gvr.lang.Define} object
 * @returns {gvr.lang.Define}
 */
gvr.lang.newDefine = function(line, name, expressions){
    return new gvr.lang.Define(line, name, expressions);
};

gvr.lang.FunctionCall = gvr.lang.BaseExpression.extend(
    /** @lends gvr.lang.FunctionCall# */
    {
        /**
         * @class Represents a functionc all in the gvr language.
         * @extends gvr.lang.BaseExpression
         * @constructs
         * @param line See {@link gvr.lang.BaseExpression#line}
         * @param fname See {@link gvr.lang.FunctionCall#fname}
         */
        init: function(line, fname){
            this._super(line, "call");
            /**
             * The name of the function to call
             * @type String
             */
            this.fname = fname;
        },
        /**
         * Steps into the block of the function stored in globals
         * under the name specified by {@link gvr.lang.FunctionCall#fname}.
         * @param globals global values passed throughout program execution.
         */
        step: function(globals){
            gvr.lang.getRunner(globals).notify(this);
            if (!globals[this.fname]){
                throw new Error("The function "+this.fname+" is undefined.");
            }
            return globals[this.fname].block.step(globals);
        }
    });

/**
 * creates a new {@link gvr.lang.FunctionCall} object
 * @returns {gvr.lang.FunctionCall}
 */
gvr.lang.newFunctionCall = function(line, fname){
    return new gvr.lang.FunctionCall(line, fname);
};

/**
 * @namespace parser module for generating the parse tree.
 */
gvr.lang.parser = {};


/**
 * regex for an expression.
 * @constant
 */
gvr.lang.parser.EXPRESSION = /^(\w*)\s*$/;
/**
 * regex for a do line.
 * @constant
 */
gvr.lang.parser.DO = /^do\s*(\d+)\s*:\s*$/;
/**
 * regex for an if line
 * @constant
 */
gvr.lang.parser.IF = /^if\s*(\w+)\s*:\s*$/;
/**
 * regex for an elif line
 * @constant
 */
gvr.lang.parser.ELIF = /^elif\s*(\w+)\s*:\s*$/;
/**
 * reges for an else line
 * @constant
 */
gvr.lang.parser.ELSE = /^else\s*:\s*$/;
/**
 * regex for a while line.
 * @constant
 */
gvr.lang.parser.WHILE = /^while\s*(\w+)\s*:\s*$/;
/**
 * regex for a function definition line.
 * @constant
 */
gvr.lang.parser.DEFINE = /^define\s*(\w+)\s*:\s*$/;
/**
 * regex for an empty line
 * @constant
 */
gvr.lang.parser.EMPTY_LINE = /^\s*$/;
/**
 * regex for the indentation of a line.
 * @constant
 */
gvr.lang.parser.INDENTATION = /^(\s*).*$/;


/**
 * removes a comment from a line. Comments start with #.
 * @param line The line form which to remove a comment.
 */
gvr.lang.parser.removeComment = function(line){
    var commentStart = line.indexOf('#');
    if (commentStart >= 0){
        line = line.slice(0, commentStart);
    }
    return line;
};


gvr.lang.parser.Parser = Class.extend(
    /** @lends gvr.lang.parser.Parser# */
    {
        /**
         * @class A parser for the gvr language.
         * @constructs
         * @param lines See {@link gvr.lang.parser.Parser#lines}
         * @param robot See {@link gvr.lang.parser.Parser#robot}
         */
        init: function(lines, robot){
            /**
             * The lines that should be parsed.
             * @type Array
             */
            this.lines = lines;

            /**
             * The robot to use when constructing expressions.
             * The expressions will reference functions scoped
             * to the robot.
             * @type gvr.robot.Robot
             */
            this.robot = robot;

            /**
             * The line index that the parser is currently parsing.
             * @type int
             */
            this.lineIndex = 0;
        },

        /**
         * Parse the lines defined by {@link gvr.lang.parser.Parser#lines}
         * @returns gvr.lang.Block
         */
        parse: function (){
            return new gvr.lang.Block(this.parseLines(""));
        },

        /**
         * @private
         */
        handlers: [
            function parseExpression(line, indent, expressions){
                var expressionMatch = line.match(gvr.lang.parser.EXPRESSION);
                if (expressionMatch){
                    var expr = expressionMatch[1];
                    gvr.debug(indent+expr);
                    if (expr in this.robot){
                        expressions.push(gvr.lang.newExpression(this.lineIndex, this.robot[expr], this.robot));
                    } else {
                        expressions.push(gvr.lang.newFunctionCall(this.lineIndex, expr));
                    }
                    return true;
                }
                return false;
            },

            function parseDo(line, indent, expressions){
                var doMatch = line.match(gvr.lang.parser.DO);
                if (doMatch){
                    var count = parseInt(doMatch[1],10);
                    gvr.debug(indent+'do '+count+':');
                    expressions.push(gvr.lang.newDo(this.lineIndex, count, this.parseBlock()));
                    return true;
                }
                return false;
            },

            function parseIf(line, indent, expressions){
                var ifMatch = line.match(gvr.lang.parser.IF);
                if (ifMatch){
                    var cond = ifMatch[1];
                    if (cond in this.robot){
                        gvr.debug(indent+'if '+cond+':');
                        expressions.push(gvr.lang.newIf(this.lineIndex, this.robot[cond], this.robot, this.parseBlock()));
                        return true;
                    }
                }
                return false;
            },

            function parseElif(line, indent, expressions){
                var elifMatch = line.match(gvr.lang.parser.ELIF);
                if (elifMatch && expressions[expressions.length-1].name === 'if'){
                    var cond = elifMatch[1];
                    gvr.debug(indent+'elif '+cond+':');
                    expressions[expressions.length-1].elifs.push(
                        gvr.lang.newIf(this.lineIndex, this.robot[cond], this.robot, this.parseBlock()));
                    return true;
                }
                return false;
            },

            function parseElse(line, indent, expressions){
                var elseMatch = line.match(gvr.lang.parser.ELSE);
                if (elseMatch && expressions[expressions.length-1].name === 'if'){
                    gvr.debug(indent+'else:');
                    expressions[expressions.length-1].elseBlock.expressions = this.parseBlock();
                    return true;
                }
                return false;
            },

            function parseWhile(line, indent, expressions){
                var whileMatch = line.match(gvr.lang.parser.WHILE);
                if (whileMatch){
                    cond = whileMatch[1];
                    if (cond in this.robot){
                        gvr.debug(indent+'while '+cond+':');
                        expressions.push(gvr.lang.newWhile(this.lineIndex, this.robot[cond], this.robot, this.parseBlock()));
                        return true;
                    }
                }
                return false;
            },

            function parseDefine(line, indent, expressions){
                var defineMatch = line.match(gvr.lang.parser.DEFINE);
                if (defineMatch){
                    var name = defineMatch[1];
                    gvr.debug(indent+'define '+name+':');
                    expressions.push(gvr.lang.newDefine(this.lineIndex, name, this.parseBlock()));
                    return true;
                }
                return false;
            }
        ],

        /**
         * @private
         */
        parseLines: function (indent){

            var expressions = [];
            for (; this.lineIndex < this.lines.length; this.lineIndex++){
                var line = gvr.lang.parser.removeComment(this.lines[this.lineIndex]);
                if (line.indexOf(indent) !== 0){
                    break;
                } else {
                    line = line.slice(indent.length);
                }
                if (line.match(gvr.lang.parser.EMPTY_LINE)){
                    continue;
                }
                var done = false;
                for (var i=0; i < this.handlers.length; i++){
                    var handler = this.handlers[i];
                    if (handler.call(this, line, indent, expressions)){
                        done = true;
                        break;
                    }
                }
                if (!done){
                    throw new Error("Syntax Error on line "+(this.lineIndex+1)+": "+line);
                }
            }
            return expressions;
        },

        /**
         * @private
         */
        parseBlock: function(){
            var nextLine = this.lines[++this.lineIndex];
            var indentation = nextLine.match(gvr.lang.parser.INDENTATION)[1];
            var subExpressions = this.parseLines(indentation);
            this.lineIndex--;
            return subExpressions;
        }

    });


/**
 * Create a new {@link gvr.lang.parser.Parser} object
 * @param lines See {@link gvr.lang.parser.Parser#lines}
 * @param robot See {@link gvr.lang.parser.Parser#robot}
 * @returns gvr.lang.parser.Parser
 */
gvr.lang.parser.newParser = function(lines, robot){
    return new gvr.lang.parser.Parser(lines, robot);
};/**
 * @namespace namespace for everything having to do with representing the gvr world.
 */
gvr.world = {};

gvr.world.World = Class.extend(
    /** @lends gvr.world.World# */
    {
        /**
         * @class Represents the state of the world that GvR lives in.
         * @constructs
         */
        init: function(){
            /**
             * The robot within the world. Currently only one robot at a time
             * is supported.
             * @type gvr.robot.Robot
             */
            this.robot = gvr.newRobot(this);

            /**
             * The walls in the world.  This is represented as an object
             * with keys of the form "x,y" and values that are another map
             * from north or east directions to a boolean.  A set of walls that
             * forms a square in the world would be represented like this:
             *
             *   {"2,2": {NORTH: true,  EAST: true},
             *    "1,2": {NORTH: false, EAST: true},
             *    "2,1": {NORTH: true,  EAST: false}}
             * @type Object
             */
            this.walls = {};

            /**
             * The beepers in the world.  This is represented as an object
             * with keys of the form "x,y" and values as the number of beepers
             * at that location.
             * @type Object
             */
            this.beepers = {};
        },
        /**
         * Sets the number of beepers at a particular location in the world.
         * @param x The x coordinate
         * @param y The y coordinate
         * @param numBeepers the number of beepers at the given coordinates.
         */
        setBeepers: function(x, y, numBeepers){
            if (numBeepers !== null){
                this.beepers[''+x+','+y] = numBeepers;
            } else {
                delete this.beepers[''+x+','+y];
            }
        },

        /**
         * Get the number of beepers at the given coordinate
         * @param x The x coordinate
         * @param y The y coordinate
         * @returns int
         */
        getBeepers: function(x, y){
            return this.beepers[''+x+','+y] || 0;
        },

        /**
         * Normalize wall coordinates by direction.  Will return the correct
         * coordinates for any wall normalized to east and north direction.
         * @private
         * @returns Object of the form of {x:x, y:y, direction:direction}
         */
        getWallCoordinates: function(x, y, direction){
            if (direction === gvr.robot.WEST){
                direction = gvr.robot.EAST;
                x -= 1;
            } else if (direction === gvr.robot.SOUTH){
                direction = gvr.robot.NORTH;
                y -= 1;
            }
            return {x:x, y:y, direction:direction};
        },

        /**
         * Sets the number of walls at a particular coordinate.
         * @param x The x coordinate
         * @param y The y coordinate
         * @param direction The direction (one of "NORTH", "SOUTH", "EAST", or "WEST").
         *                  Its a good idea to use the constants defined in {@link gvr.robot}
         * @param count The number of walls to put at this location.  Usually just 1.
         *              If more than one, walls will extend out in the direction to the
         *              left of the given direction.
         * @example
         * calling
         *
         *          world.setWall(2, 2, "NORTH", 3);
         *
         * is equivalent to
         *
         *          for (var i=0; i < 2; i++){
         *            world.setWall(2+i, 2, "NORTH", 1);
         *          }
         */
        setWall: function(x, y, direction, count){
            var coords = this.getWallCoordinates(x, y, direction);
            var key = ''+coords.x+','+coords.y;
            if (!this.walls[key]){
                this.walls[key] = {NORTH:false, EAST:false};
            }
            this.walls[key][coords.direction] = true;
            if (count !== null && count > 1){
                var offset = gvr.robot.OFFSET[direction];
                this.setWall(x+offset.y, y+offset.x, direction, count-1);
            }
        },


        /**
         * Return the state of the wall at the given location and direction.
         * @param x The x coordinate
         * @param y The y coordinate
         * @param direction The direction.  One of "NORTH", "SOUTH", "EAST", "WEST".
         *                  It is a good idea to use the constants defined in {@link gvr.robot}
         * @returns Boolean
         */
        getWall: function(x, y, direction){
            var coords = this.getWallCoordinates(x, y, direction);
            var wall = this.walls[''+coords.x+','+coords.y];
            return (wall && wall[coords.direction]) ||
                (coords.x === 0 && coords.direction === gvr.robot.EAST) ||
                (coords.y === 0 && coords.direction === gvr.robot.NORTH) ||
                false;
        }
    });

/**
 * @namespace namepsace for the world file parser.
 */
gvr.world.parser = {};

/**
 * regex for any coordinate (x, y, direction) specification for an object.
 * This is used to match both:
 *   ROBOT 5 5 N 3 #a robot at (5, 5) facing North with 3 beepers.
 * and
 *   WALL 5 5 E 2 #2 walls eastern walls starting at 5,5 going north.
 * @constant
 */
gvr.world.parser.SPEC = /^\s*(\w+)\s+(\d+)\s+(\d+)\s+([NESW])\s+(\d+)?\s*$/;

/**
 * regex for beepers.  Should match something like:
 *   BEEPERS 1 2 5
 * which means 5 beepers at coordinates (1,2)
 * @constant
 */
gvr.world.parser.BEEPERS = /^\s*(\w+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/;

/**
 * @constant
 */
gvr.world.parser.EMPTY_LINE = gvr.lang.parser.EMPTY_LINE;


gvr.world.parser.Parser = Class.extend(
    /**
     * @lends gvr.world.parser.Parser#
     */
    {
        /**
         * @class parse lines into a world.
         * @constructs
         * @param lines See {@link gvr.world.parser.Parser#lines}
         * @param world See {@link gvr.world.parser.Parser#world}
         */
        init: function(lines, world){
            /**
             * The lines to parse
             * @type Array
             */
            this.lines = lines;

            /**
             * The world to update with the results of parsing.
             * @type gvr.world.World
             */
            this.world = world;
        },

        /**
         * parse the lines in the world.
         */
        parse: function (){
            var name,xCoord,yCoord,count;
            for (var i =0; i < this.lines.length; i++){
                var line = gvr.lang.parser.removeComment(this.lines[i]);
                if (line.match(gvr.world.parser.EMPTY_LINE)){
                    continue;
                }
                var specMatch = line.match(gvr.world.parser.SPEC);
                if (specMatch){
                    name = specMatch[1].toUpperCase();
                    xCoord = parseInt(specMatch[2],10);
                    yCoord = parseInt(specMatch[3],10);
                    var direction = {N:"NORTH",S:"SOUTH",E:"EAST",W:"WEST"}[specMatch[4]];
                    count = parseInt(specMatch[5],10) || 1;
                    if (name === "ROBOT"){
                        this.world.robot.x = xCoord;
                        this.world.robot.y = yCoord;
                        this.world.robot.beepers = count;
                        this.world.robot.direction = direction;
                    }
                    if (name === "WALL"){
                        this.world.setWall(xCoord, yCoord, direction, count);
                    }
                }
                var beepersMatch = line.match(gvr.world.parser.BEEPERS);
                if (beepersMatch){
                    name = beepersMatch[1].toUpperCase();
                    if (name == "BEEPERS"){
                        xCoord = parseInt(beepersMatch[2],10);
                        yCoord = parseInt(beepersMatch[3],10);
                        count =  parseInt(beepersMatch[4],10);
                        this.world.setBeepers(xCoord, yCoord, count);
                    }
                }

            }
        }
    });


/**
 * Create a new {@link gvr.world.parser.Parser} object.
 * @returns gvr.world.parser.Parser
 */
gvr.world.parser.newParser = function(lines, world){
    return new gvr.world.parser.Parser(lines, world);
};

var gvr = gvr || {};

/**
 * @namespace namespace for everything related to the gvr-online website.
 */
gvr.web = gvr.web || {};


/**
 * @namespace namespace for everything related to talking to the backend service.
 */
gvr.web.client = {};

gvr.web.client.Client = Class.extend(
    /** @lends gvr.web.client.Client# */
    {
        /**
         * @class A client for easily talking to the backend.
         * @constructs
         * @param rootUrl the root url from which the rest JSON api is available.
         */
        init: function(rootUrl){
            this.rootUrl = rootUrl || '/api';
        },

        /**
         * Redirects the user to the login page.
         */
        logon: function(){
            window.location = this.rootUrl+'/logon?nextURL='
                +escape(window.location.href);
        },

        /**
         * Redirects the user to the logout page.
         */
        logout: function(){
            window.location = this.rootUrl+'/logout?nextURL='
                +escape(window.location.href);
        },

        /**
         * post some data to a url and call a callback.
         * @private
         * @param url the url to post to.
         * @param data the data to post
         * @param callback the function to call upon success
         */
        post: function(url, data, callback){
            jQuery.ajax(
                {
                    type: 'POST',
                    data: data,
                    dataType: 'json',
                    url: url,
                    success: callback
                });
        },


        /**
         * Get the currently logged in user.
         * @param callback the function to call when the currently logged in user is received.
         */
        getUser: function(callback){
            jQuery.getJSON(
                this.rootUrl+'/user', callback);
        },

        /**
         * Get the list of programs.
         * @param callback the function to call with the returned programs object.
         */
        getPrograms: function(callback){
            jQuery.getJSON(
                this.rootUrl+'/programs', callback);
        },

        /**
         * Get a program by key.
         * @param key the program key
         * @param callback the function to call with the returned program.
         */
        getProgram: function(key, callback){
            jQuery.getJSON(
                this.rootUrl+'/programs/'+key, callback);
        },

        /**
         * Add a program to the backend.  The same program will be returned
         * with any additional information generated by the backend, for
         * example the program's unique key.
         * @param program a valid program object.
         * @param callback the function to call with the returned program.
         */
        addProgram: function(program, callback){
            this.post(this.rootUrl+'/programs', program, callback);
        },

        /**
         * Save a program. The same program will be returned with any
         * additional information generated by the backend.
         * @param program the program to save
         * @param callback the function to call with the returned program.
         */
        saveProgram: function(program, callback){
            this.post(this.rootUrl+'/programs/'+program.key, program, callback);
        },

        /**
         * Delete a program.
         * @param program The program to delete
         * @param callback The function to call upon successful deletion.
         */
        deleteProgram: function(program, callback){
            jQuery.get(
                this.rootUrl+'/delete/'+program.key, callback);
        },


        /**
         * Get all the worlds
         * @param callback The function to call with returned worlds.
         */
        getWorlds: function(callback){
            jQuery.getJSON(
                this.rootUrl+'/worlds', callback);
        },

        /**
         * Get the world associated with the given key.
         * @param key The unique key for the world.
         * @param callback The function to call with the returned world.
         */
        getWorld: function(key, callback){
            jQuery.getJSON(
                this.rootUrl+'/worlds/'+key, callback);
        },

        /**
         * Add the given world to the backend and return a new version
         * with additional generated information, like the unique key.
         * @param world The world to add.
         * @param callback The function to call with the returned world object.
         */
        addWorld: function(world, callback){
            this.post(this.rootUrl+'/worlds', world, callback);
        },

        /**
         * Save the given world
         * @param world The world to save.
         * @param callback The function to call upon success.
         */
        saveWorld: function(world, callback){
            this.post(this.rootUrl+'/worlds/'+world.key, world,callback);
        },

        /**
         * Delete the given world from the backend.
         * @param world The world to delete.
         * @param callback The function to call upon successful deletion.
         */
        deleteWorld: function(world, callback){
            jQuery.get(
                this.rootUrl+'/delete/'+world.key, callback);
        },

        /**
         * Get the list of examples.
         * @param callback the function to call with the returned examples object.
         */
        getExamples: function(callback){
            jQuery.getJSON(
                this.rootUrl+'/examples', callback);
        },

        /**
         * Get a example by key.
         * @param key the example key
         * @param callback the function to call with the returned example.
         */
        getExample: function(key, callback){
            jQuery.getJSON(
                this.rootUrl+'/examples/'+key, callback);
        },

        /**
         * Add a example to the backend.  The same example will be returned
         * with any additional information generated by the backend, for
         * example the example's unique key.
         * @param example a valid example object.
         * @param callback the function to call with the returned example.
         */
        addExample: function(example, callback){
            this.post(this.rootUrl+'/examples', example,callback);
        },

        /**
         * Save a example. The same example will be returned with any
         * additional information generated by the backend.
         * @param example the example to save
         * @param callback the function to call with the returned example.
         */
        saveExample: function(example, callback){
            this.post(example, this.rootUrl+'/examples/'+example.key, callback);
        },

        /**
         * Delete a example.
         * @param example The example to delete
         * @param callback The function to call upon successful deletion.
         */
        deleteExample: function(example, callback){
            jQuery.get(
                this.rootUrl+'/delete/'+example.key, callback);
        }

    });


/**
 * Returns a new instance of the web client.
 * @param rootUrl See {@link gvr.web.client.Client}
 * @returns {gvr.web.client.Client}
 */
gvr.web.client.newClient = function(rootUrl){
    return new gvr.web.client.Client(rootUrl);
};/**
 * @namespace namespace for everything having to do with renderers.
 */
gvr.renderer = {};

gvr.renderer.Renderer = Class.extend(
    /** @lends gvr.renderer.Renderer# */
    {
        /**
         * @class Renderer for a world.
         * @constructs
         * @param canvasEl The id of a <canvas> dom element
         *                 which is used as the rendering context.
         * @param world See {@link gvr.renderer.Renderer#world}
         */
        init: function(canvasEl, world){
            /**
             * The canvas dom element.
             */
            this.canvas = document.getElementById(canvasEl);

            /**
             * The drawing context which is obtained
             * from {@link gvr.renderer.Renderer#canvas}
             */
            this.context = this.canvas.getContext('2d');

            /**
             * The world object to render.
             * @type gvr.world.World
             */
            this.world = world;

            /**
             * The lower x coordinate bound for rendering the world.
             * @type int
             */
            this.startX = 1;

            /**
             * The lower y coordinate bound for rendering the world.
             * @type int
             */
            this.startY = 1;

            /**
             * The upper x coordinate bound for rendering the world.
             * @type int
             */
            this.endX = 12;

            /**
             * The upper y coordinate bound for rendering the world.
             * @type int
             */
            this.endY = 12;

            /**
             * The scale (in pixels) of each coordinate.
             * @type int
             */
            this.scale = 40;
        },

        /**
         * Given world coordiantes, returns corresponding coordinates
         * for the rendering context.
         * @param x the x coordinate in the world.
         * @param y the y coordinate in the world.
         */
        getCanvasCoords: function(x, y){
            return {x: x*this.scale,y: y*this.scale};
        },

        /**
         * Render the boundaries.
         * @private
         */
        renderBounderies: function(){
            this.context.fillStyle = this.startY === 1 ? 'red':'#aaffaa';
            var coords = this.getCanvasCoords(this.startX,this.startY);
            this.context.fillRect(coords.x,coords.y,this.canvas.width,2);

            this.context.fillStyle = this.startX === 1 ? 'red':'#aaffaa';
            coords = this.getCanvasCoords(this.startX,this.startY);
            this.context.fillRect(coords.x,coords.y,2,this.canvas.height);
        },

        /**
         * Render the street corners
         * @private
         */
        renderCorners: function(){
            this.context.fillStyle = '#000000';
            for (var x=2; x <= this.endX-this.startX+1; x++){
                for (var y=2; y <= this.endY-this.startY+1; y++){
                    var coords = this.getCanvasCoords(x,y);
                    this.context.fillRect(coords.x,coords.y,4,4);
                }
            }
        },

        /**
         * Render the robot
         * @private
         */
        renderRobot: function(){
            this.context.save();
            this.context.fillStyle = 'white';
            this.context.lineWidth = 5;
            var coords = this.getCanvasCoords(
                this.world.robot.x,this.world.robot.y);
            this.context.translate(
                coords.x+this.scale/2, coords.y+this.scale/2);
            var radians = {
                NORTH:0,
                WEST:Math.PI/2,
                SOUTH:Math.PI,
                EAST:-Math.PI/2
            }[this.world.robot.direction];
            this.context.rotate(radians);
            var padding = this.scale*0.2;
            this.context.beginPath();
            this.context.moveTo(-this.scale/2+padding, -this.scale/2+padding);
            this.context.lineTo(this.scale/2-padding, -this.scale/2+padding);
            this.context.lineTo(0,this.scale/2-padding);
            this.context.closePath();
            this.context.stroke();
            this.context.fill();
            this.context.restore();
        },

        /**
         * Render the coordinates along the sides of the canvas
         * @private
         */
        renderCoordinates: function(){
            this.context.fillStyle = 'black';
            var coords, width;
            for (var x=this.startX; x < this.endX; x++){
                coords = this.getCanvasCoords(x, this.startY-1);
                this.context.save();
                width = this.context.mozMeasureText(""+x);
                this.context.translate(
                    coords.x+this.scale/2-width/2, coords.y+this.scale/2);
                this.context.scale(1,-1);
                this.context.mozDrawText(""+x);
                this.context.restore();
            }
            for (var y=this.startY; y < this.endY; y++){
                coords = this.getCanvasCoords(this.startX-1, y);
                this.context.save();
                width = this.context.mozMeasureText(""+y);
                this.context.translate(
                    coords.x+this.scale/2-width/2, coords.y+this.scale/2-6);
                this.context.scale(1,-1);
                this.context.mozDrawText(""+y);
                this.context.restore();
            }
        },

        /**
         * Render the walls in the world.
         * @private
         */
        renderWalls: function(){
            this.context.fillStyle = 'red';
            for (var x=this.startX; x < this.endX; x++){
                for (var y=this.startY; y < this.endY; y++){
                    var coords = this.getCanvasCoords(x, y);
                    if (this.world.getWall(x, y, gvr.robot.NORTH)){
                        this.context.fillRect(
                            coords.x,coords.y+this.scale, this.scale, 2);
                    }
                    if (this.world.getWall(x, y, gvr.robot.EAST)){
                        this.context.fillRect(
                            coords.x+this.scale,coords.y, 2, this.scale);
                    }
                }
            }
        },

        /**
         * Render the beepers in the world
         * @private
         */
        renderBeepers: function(){
            this.context.fillStyle = 'blue';
            this.context.strokeStyle = 'blue';
            for (var x=this.startX; x < this.endX; x++){
                for (var y=this.startY; y < this.endY; y++){
                    var coords = this.getCanvasCoords(x, y);
                    var padding = this.scale*0.2;
                    var beepers = this.world.getBeepers(x, y);
                    if (beepers > 0){
                        this.context.beginPath();
                        this.context.arc(
                            coords.x+this.scale/2, coords.y+this.scale/2,
                            this.scale/2-padding, 0, Math.PI*2, false);
                        this.context.stroke();
                        if (beepers < 2){
                            this.context.beginPath();
                            this.context.arc(
                                coords.x+this.scale/2, coords.y+this.scale/2,
                                this.scale/2-padding-3, 0, Math.PI*2, false);
                            this.context.fill();
                        } else {
                            this.context.save();
                            var width = this.context.mozMeasureText(
                                ""+beepers);
                            this.mozTextStyle = "10px sans-serif";
                            this.context.translate(
                                coords.x+this.scale/2-width/2,
                                coords.y+this.scale/2-6);
                            this.context.scale(1,-1);
                            this.context.mozDrawText(""+beepers);
                            this.context.restore();
                        }
                    }
                }
            }
        },

        /**
         * Adjusts {@link gvr.renderer.Renderer#startX}, {@link gvr.renderer.Renderer#startY},
         * {@link gvr.renderer.Renderer#endX}, and {@link gvr.renderer.Renderer#endY} such that
         * the robot is guaranteed to be within view of the rendering boundaires.
         */
        followRobot: function(){
            var maxX = this.endX-1;
            var maxY = this.endY-1;
            var jumpX = 0;
            var jumpY = 0;
            if (this.world.robot.x > maxX){
                jumpX = this.world.robot.x - maxX;
            } else if (this.world.robot.x < this.startX){
                jumpX =  this.world.robot.x - this.startX;
            }
            if (this.world.robot.y > maxY){
                jumpY = this.world.robot.y - maxY;
            } else if (this.world.robot.y < this.startY){
                jumpY = this.world.robot.y - this.startY;
            }
            this.startX += jumpX;
            this.endX += jumpX;
            this.startY += jumpY;
            this.endY += jumpY;
        },

        render: function(){
            this.followRobot();
            this.context.save();
            this.context.clearRect(0,0,this.canvas.width, this.canvas.height);
            //reorient to bottom left being 0 0;
            this.context.transform(1,0,0,-1,0,this.canvas.height);
            this.renderCorners();

            this.context.save();
            this.context.translate(-(this.startX-1)*this.scale,
                                   -(this.startY-1)*this.scale);
            this.renderBounderies();
            this.renderWalls();
            this.renderBeepers();
            this.renderRobot();
            this.renderCoordinates();
            this.context.restore();

            this.context.restore();
        }

    });
/**
 * @namespace namespace for everything having to do with the robot.
 */
gvr.robot = {};

/**
 * The north direction
 * @static
 */
gvr.robot.NORTH = 'NORTH';

/**
 * The west direction
 * @static
 */
gvr.robot.WEST  = 'WEST';

/**
 * the south direction
 * @static
 */
gvr.robot.SOUTH = 'SOUTH';

/**
 * the east direction
 * @static
 */
gvr.robot.EAST  = 'EAST';

/**
 * Hash for finding the direction to the immediate left of the given direction.
 * @static
 */
gvr.robot.LEFT_OF = {};
gvr.robot.LEFT_OF[gvr.robot.NORTH] = gvr.robot.WEST;
gvr.robot.LEFT_OF[gvr.robot.WEST ] =  gvr.robot.SOUTH;
gvr.robot.LEFT_OF[gvr.robot.SOUTH] = gvr.robot.EAST;
gvr.robot.LEFT_OF[gvr.robot.EAST ] =  gvr.robot.NORTH;


/**
 * offsets which translate direction into cartesian coordinate offsets.
 * @static
 */
gvr.robot.OFFSET = {
    NORTH: {x:0, y:1},
    SOUTH: {x:0, y:-1},
    EAST:  {x:1,y:0},
    WEST:  {x:-1, y:0}
};

gvr.robot.Robot = Class.extend(
    /** @lends gvr.robot.Robot# */
    {
        /**
         * @class Represents a robot.
         * @constructs
         * @param world See {@link gvr.robot.Robot#world}
         */
        init: function(world){
            /**
             * The x coordinate of the robot.
             * @type int
             */
            this.x = 1;

            /**
             * The y coordinate of the robot.
             * @type int
             */
            this.y = 1;

            /**
             * The world the robot lives in.
             * @type gvr.world.World
             */
            this.world = world;

            /**
             * The direction the robot is facing.
             * One of {@link gvr.robot.NORTH}
             *        {@link gvr.robot.SOUTH}
             *        {@link gvr.robot.EAST}
             *     or {@link gvr.robot.WEST}
             */
            this.direction = gvr.robot.NORTH;

            /**
             * The number of beepers that the robot is carrying.
             * @type int
             */
            this.beepers = 0;

            /**
             * Whether or not the robot is turned on.
             * @type boolean
             */
            this.on = true;
        },

        /**
         * move the robot one coordinate point in the direction the robot is facing.
         * If a wall is in front of the robot, this method throws an error.
         */
        move: function move(){
            if (this.front_is_blocked()){
                throw new Error("Ran into a wall");
            }
            var offset = gvr.robot.OFFSET[this.direction];
            this.x += offset.x;
            this.y += offset.y;
        },

        /**
         * Turn the robot left.
         */
        turnleft: function turnleft(){
            this.direction = gvr.robot.LEFT_OF[this.direction];
        },


        /**
         * Pick up a beeper from the current location of the robot.
         * If there are no beepers in the world at the robot's current location,
         * an error is thrown.
         */
        pickbeeper: function pickbeeper(){
            var beepers = this.world.getBeepers(this.x, this.y);
            if (beepers > 0){
                this.beepers += 1;
                this.world.setBeepers(this.x, this.y, beepers-1);
            } else {
                throw new Error("No beepers to pick up.");
            }
        },

        /**
         * Put a beeper down in the world where the robot is located.
         * If the robot does not currently have any beepers, an error is thrown.
         */
        putbeeper: function putbeeper(){
            if (this.beepers > 0){
                this.beepers -= 1;
                this.world.setBeepers(
                    this.x, this.y,
                    this.world.getBeepers(this.x,this.y)+1);
            } else {
                throw new Error("No beepers in beeper bag.");
            }
        },

        /**
         * turn the robot off.
         */
        turnoff: function turnoff(){
            this.on = false;
            gvr.alert("Robot turned off");
        },

        /**
         * @returns true if the robot is facing north.
         */
        facing_north: function facing_north(){
            return this.direction === gvr.robot.NORTH;
        },
        /**
         * @returns true if the robot is facing south
         */
        facing_south: function facing_south(){
            return this.direction === gvr.robot.SOUTH;
        },
        /**
         * @returns true if the robot is facing east
         */
        facing_east: function facing_east(){
            return this.direction === gvr.robot.EAST;
        },
        /**
         * @returns true if the robot is facing west
         */
        facing_west: function facing_west(){
            return this.direction === gvr.robot.WEST;
        },

        /**
         * @returns true if the robot has any beepers
         */
        any_beepers_in_beeper_bag: function any_beepers_in_beeper_bag(){
            return this.beepers > 0;
        },

        /**
         * @returns true if the world has any beepers at the robot's currently location.
         */
        next_to_a_beeper: function next_to_a_beeper(){
            return this.world.getBeepers(this.x, this.y) > 0;
        },

        /**
         * @returns true if there is a wall in front of the robot.
         */
        front_is_blocked: function front_is_blocked(){
            return this.world.getWall(this.x, this.y, this.direction);
        },
        /**
         * @returns true of there is a wall to the left of the robot.
         */
        left_is_blocked: function left_is_blocked(){
            return this.world.getWall(
                this.x, this.y, gvr.robot.LEFT_OF[this.direction]);
        },
        /**
         * returns true if there is a wall to the right of the robot.
         */
        right_is_blocked: function right_is_blocked(){
            var direction = gvr.robot.LEFT_OF[gvr.robot.LEFT_OF[gvr.robot.LEFT_OF[this.direction]]];
            return this.world.getWall(this.x, this.y, direction);
        },

        /**
         * The opposite of {@link gvr.robot.Robot#facing_north}
         */
        not_facing_north: function(){
            return !this.facing_north();
        },

        /**
         * The opposite of {@link gvr.robot.Robot#facing_south}
         */
        not_facing_south: function(){
            return !this.facing_south();
        },

        /**
         * The opposite of {@link gvr.robot.Robot#facing_east}
         */
        not_facing_east:  function(){
            return !this.facing_east();
        },

        /**
         * The opposite of {@link gvr.robot.Robot#facing_west}
         */
        not_facing_west: function(){
            return !this.facing_west();
        },

        /**
         * The opposite of {@link gvr.robot.Robot#any_beepers_in_beeper_bag}
         */
        no_beepers_in_beeper_bag: function no_beepers_in_beeper_bag(){
            return !this.any_beepers_in_beeper_bag();
        },

        /**
         * The opposite of {@link gvr.robot.Robot#next_to_a_beeper}
         */
        not_next_to_a_beeper: function not_next_to_a_beeper(){
            return !this.next_to_a_beeper();
        },

        /**
         * The opposite of {@link gvr.robot.Robot#front_is_blocked}
         */
        front_is_clear: function front_is_clear(){
            return !this.front_is_blocked();
        },

        /**
         * The opposite of {@link gvr.robot.Robot#left_is_blocked}
         */
        left_is_clear: function left_is_clear(){
            return !this.left_is_blocked();
        },

        /**
         * The opposite of {@link gvr.robot.Robot#right_is_blocked}
         */
        right_is_clear: function right_is_clear(){
            return !this.right_is_blocked();
        }

    });
/** @namespace namespace for everything dealing with running programs.*/
gvr.runner = {
    /** @lends gvr.runner */
    Runner: Class.extend(
        /** @lends gvr.runner.Runner# */
        {
            /**
             * @class Object for running a program.
             * @constructs
             * @param program See {@link gvr.runner.Runner#program}
             * @param renderer See {@link gvr.runner.Runner#renderer}
             * @param notify See {@link gvr.runner.Runner#notify}
             */
            init: function(program, renderer, notify){
                /**
                 * The program to run.
                 * @type gvr.lang.Block
                 */
                this.program = program;

                /**
                 * The execution stack
                 * @type Array
                 */
                this.stack = [this.program];

                /**
                 * The renderer, which gets called after every execution step.
                 * @type gvr.renderer.Renderer#
                 */
                this.renderer = renderer;

                /**
                 * @private
                 */
                this.globals = {};
                this.globals[gvr.lang.RUNNER_GLOBAL_KEY] = this;

                /**
                 * keeps track of the timeout which pauses program execution.
                 * @private
                 */
                this.timeout = null;

                /**
                 * currently unused
                 * @type function
                 */
                this.notify = notify || function(item){};

                /**
                 * Keeps track of whether or not the runner is currently running.
                 * @type boolean
                 */
                this.running = false;
            },

            /**
             * Print out a human readable representation of the current
             * execution stack
             * @returns Array
             */
            printStackTrace: function(){
                var trace = [];
                for (var i = 0; i < this.stack.length; i++){
                    trace.push(this.stack[i].name);
                }
                return trace;
            },

            /**
             * Perform the next execution step.
             * @param Same as the callback parameter for {@link gvr.runner.Runner#run}
             */
            step: function(callback){
                this.run(0, callback, true);
            },

            /**
             * Stop all execution.
             */
            stop: function(){
                window.clearTimeout(this.timeout);
                this.running = false;
            },

            /**
             * Run the program.
             * @param speed The number of milliseconds to wait
             *              before performing the next execution step.
             *              Use 0 for instant execution.
             * @param callback function to call when there is nothing left to run.
             * @param step If true, only one execution step will occur.
             *             If false, execution will continue to happen
             *             until there is an error or the program finishes.
             */
            run: function(speed, callback, step){
                this.running = true;
                var instant = speed === -1;
                speed = speed || 200;

                if (this.stack.length > 0){
                    // stepping
                    var last = this.stack.pop();
                    try {
                        var next = last.step(this.globals);
                    } catch (e){
                        gvr.alert(e.message);
                        return;
                    }
                    this.stack = this.stack.concat(next);
                    // rendering and loopback
                    if (!instant){
                        this.renderer.render();
                    }

                    if (next.length > 0){
                        var that = this;
                        if (instant){
                            this.run(speed, callback, step);
                        } else if (!step){
                            this.timeout = window.setTimeout(
                                function(){that.run(speed, callback, step);},
                                speed);
                        }
                    } else {
                        this.run(speed, callback, step);
                    }

                } else {
                    this.stop();
                    if (this.renderer.world.robot.on){
                        this.stop();
                        gvr.alert("Robot ran out of instructions.");
                    }
                    if (typeof callback === "function"){
                        callback();
                    }
                    if (instant){
                        this.renderer.render();
                    }
                }
            }
        })
};
/**
 * @fileOverview This file defines the Robot and World objects.
 * @author Paul Carduner
 */

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

