$(document).ready(
  function(){
    var world = gvr.newWorld();
    var r = gvr.newRenderer('canvas', world);

    r.render();

    var R = world.robot;

    $("#execute-button").click(
      function execute(){
        $("#reload-button").click();
        var lines = $('#program-editor').val().split('\n');
        try{
          var program = gvr.lang.parser.newParser(lines, world.robot).parse();
          var renderer = gvr.newRenderer('canvas', world);
          var runner = gvr.newRunner(program, renderer);
          runner.run(
            parseInt($("#speed").val()));
        } catch (e){
          alert(e.message);
        }
      }
    );

    var stepState = {inStep: false};
    $("#step-button").click(
      function step(){
        if (!stepState.inStep){
          $("#reload-button").click();
          var lines = $('#program-editor').val().split('\n');
          try{
            var program = gvr.lang.parser.newParser(lines, world.robot).parse();
            var renderer = gvr.newRenderer('canvas', world);
            stepState.runner = gvr.newRunner(
              program,
              renderer,
              function(item){
                if (!item.line) return;
                var start = 0;
                for (var i=0; i < item.line; i++){
                  start += lines[i].length + 1;
                }
                var textarea = $('#program-editor').get(0);
                textarea.selectionEnd = start+lines[item.line].length;
                textarea.selectionStart = start;
                textarea.scrollTop = textarea.scrollHeight*item.line/lines.length;
              }
            );
          } catch (e){
            alert(e.message);
          }
          stepState.inStep = true;
        }
        stepState.runner.step();
      }
    );

    $("#reload-button").click(
      function reload(){
        var lines = $("#world-editor").val().split('\n');
        gvr.world.parser.newParser(lines, world).parse();
        gvr.newRenderer('canvas', world).render();
      }
    );

    $(".panel .header .tab").click(
      function(){
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
        var tabId = $(this).attr("id");
        var contentId = tabId.slice(0, tabId.length-4);
        $("#"+contentId).siblings(".tab-content").hide();
        $("#"+contentId).show();
      });

    $("#reload-button").click();
    gvr.DEBUG = true;

  });
