$(document).ready(
    function(){

        var CLIENT = gvr.web.client.newClient();
        var PROGRAM = null;
        var WORLD = null;
        var RUNNER = null;

        function extractQuery(){
            var data = {};
            var query = window.location.search;
            while (query.length > 0){
                var match = query.match(/([^\?\&\=]*)\=([^\&]*)/);
                if (!match){
                    break;
                }
                data[match[1]] = match[2];
                query = query.slice(query.indexOf(match[0])+match[0].length);
            }
            return data;
        }

        function updateView(){
            var world = gvr.newWorld();
            gvr.world.parser.newParser(
                WORLD.definition.split("\n"),
                world).parse();
            var renderer = gvr.newRenderer("share-canvas", world);
            renderer.render();
            var program = gvr.lang.parser.newParser(
                PROGRAM.definition.split("\n"),
                world.robot).parse();

            RUNNER = gvr.newRunner(program, renderer);
            $("#run-button").removeAttr("disabled");
        }

        function setProgram(program){
            PROGRAM = program;
            $("#share-panel")
                .find(".header .program-title").html(PROGRAM.title).end()
                .find(".example-code").html(PROGRAM.definition).end()
                .find(".program-description").text(PROGRAM.description).end();
        }

        function setWorld(world){
            WORLD=world;
            $("#share-panel .header .world-title").html(WORLD.title);
        }


        /**
         * initialize the page.
         */

        $("#templates .loading-message")
            .clone()
            .find(".message").html("Loading Example...").end()
            .appendTo("#share-view");

        $("#run-button").click(
            function(){
                gvr.world.parser.newParser(
                    WORLD.definition.split("\n"),
                    RUNNER.renderer.world).parse();
                RUNNER.renderer.render();
                var program = gvr.lang.parser.newParser(
                    PROGRAM.definition.split("\n"),
                    RUNNER.renderer.world.robot).parse();

                RUNNER = gvr.newRunner(program, RUNNER.renderer);

                RUNNER.run(5);
            });
        var data = extractQuery();
        CLIENT.getExample(
            data.example,
            function(example){
                setProgram(example.program);
                setWorld(example.world);
                $("#share-view").find(".loading-message").remove();
                $("#share-panel")
                    .find(".example-message").text(example.message).end()
                    .show();
                updateView();
            });

    });