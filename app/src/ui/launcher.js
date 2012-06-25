goog.require("gvr");
goog.require("gvr.i18n");
goog.require("gvr.web.client");
goog.require("gvr.world.parser");
goog.require("gvr.i18n.en_us");
goog.require("gvr.i18n.latin_pig");
/**
 * define some additional jquery plugins for use in the UI.
 */
(function(){

     jQuery.fn.gvrDialog = function(options){
         var dialog = $("#templates .dialog")
             .clone()
             .addClass(options.cssClass || "")
             .appendTo("body");

         var window = dialog.find(".window")
             .append(this);

         var xOffset = ($(document).width()-window.width())/2;
         window.css('left', xOffset);
         dialog.find(".window-shadow")
             .css('left',xOffset+5);

         if (options.close){
             $(options.close).click(
                 function(){
                     dialog.remove();
                 });
         }
         return this;
     };
 })();

$(document).ready(
  function(){

      var CLIENT = gvr.web.client.newClient();
      var SHOW_ALL_FILES = true;
      var SEARCH_FILES = '';

      var authenticated = false;
      var USER = null;
      var PROGRAM_CACHE = {};
      var WORLD_CACHE = {};
      var runner = null;

      function getOpenedProgram(){
          return PROGRAM_CACHE[OpenedProgramKey];
      }

      function getOpenedWorld(){
          return WORLD_CACHE[openedWorldKey];
      }

      /**
       * @function reconcileCaches
       * Makes sure the program and world cache are up to date with what
       * the user sees in the editor.
       */
      function reconcileCaches(){
          function reconcile(file, editorPrefix){
              if (file){
                  file.title = $("#"+editorPrefix+"-editor-title").val();
                  file.definition = $("#"+editorPrefix+"-editor").val();
                  file.description = $("#"+editorPrefix+"-editor-description").val();
              }
          }
          reconcile(getOpenedProgram(), "program");
          reconcile(getOpenedWorld(), "world");
      }

      var world = gvr.newWorld();

      /**
       * ------------------ Generic widget handlers --------------------
       */

      /**
       * Setup tab panels...
       */
      $(".panel .header .tab").click(
          function(){
              $(this).siblings().removeClass('selected');
              $(this).addClass('selected');
              var tabId = $(this).attr("id");
              var contentId = tabId.replace(/-tab$/, "");
              $("#"+contentId).siblings(".tab-content").hide();
              $("#"+contentId).show();
          });


      /**
       * ------------------ Button event handlers ----------------------
       */

      /**
       * setup login and logout buttons.
       */
      $("#logout-link").click(
          function(){
              CLIENT.logout();
          });
      $("#login-link").click(
          function(){
              CLIENT.logon();
          });

      function updateExecutionButtons(){
          if (runner !== null && runner.running){
              $("#stop-button").removeAttr("disabled");
              $("#execute-button, #step-button").attr("disabled","disabled");
          } else {
              $("#stop-button").attr("disabled","disabled");
              $("#execute-button, #step-button").removeAttr("disabled");
          }
      }

      /**
       * setup the "execute" button
       */
      $("#execute-button").click(
          function execute(){
              $("#reload-button").click();
              var lines = $('#program-editor').val().split('\n');
              try{
                  var program = gvr.lang.parser.newParser(lines, world.robot).parse();
                  var renderer = gvr.newRenderer('canvas', world);
                  runner = gvr.newRunner(program, renderer);
                  runner.run(
                      parseInt($("#speed").val()),
                      function(success){
                          updateExecutionButtons();
                      });
                  updateExecutionButtons();
              } catch (e){
                  gvr.alert(e.message);
                  runner.stop();
                  updateExecutionButtons();
              }
          }
      );

      /**
       * setup the "stop" button
       */
      $("#stop-button").click(
          function stop(){
              runner.stop();
              updateExecutionButtons();
          }
      );

      /**
       * setup the "reload" button
       */
      $("#reload-button").click(
          function reload(){
              var lines = $("#world-editor").val().split('\n');
              world = gvr.newWorld();
              gvr.world.parser.newParser(lines, world).parse();
              gvr.newRenderer('canvas', world).render();
          }
      );


      /**
       * setup the "step" button
       */
      var stepState = {inStep: false};
      $("#step-button").click(
          function step(){
              if (!stepState.inStep){
                  $("#reload-button").click();
                  var lines = $('#program-editor').val().split('\n');
                  try{
                      var program = gvr.lang.parser.newParser(lines, world.robot).parse();
                      var renderer = gvr.newRenderer('canvas', world);
                      runner = gvr.newRunner(
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
                      gvr.alert(e.message);
                      stepState.inStep = false;
                      runner.stop();
                  }
                  stepState.inStep = true;
              }
              runner.step(
                  function(){
                      stepState.inStep = false;
                      runner.stop();
                  });
          }
      );


      /**
       * setup the "Save Program" button.
       */

      $("#save-program").click(
          function(){
              gvr.alert("Saving...");
              reconcileCaches();
              CLIENT.saveProgram(
                  getOpenedProgram(),
                  function(){
                      gvr.alert("Saved "+getOpenedProgram().title);
                  });
          });

      /**
       * setup the "Save World" button.
       */

      $("#save-world").click(
          function(){
              gvr.alert("Saving...");
              reconcileCaches();
              CLIENT.saveWorld(
                  getOpenedWorld(),
                  function(){
                      gvr.alert("Saved "+getOpenedWorld().title);
                  });
          });

      $("#new-world").click(createNewWorld);
      $("#new-program").click(createNewProgram);

      /**
       * setup the "Share" button.
       */
      $("#share-button").click(
          function(){
              var world = getOpenedWorld();
              var program = getOpenedProgram();
              if (!(program && world)){
                  gvr.alert("You must open a world and program before you can share them.");
              } else {
                  $("#templates .share-form")
                      .clone()
                      .gvrDialog(
                          {
                              cssClass:'share-form-dialog',
                              close: '[name="cancel"]'
                          })
                      .find('[name="share"]')
                      .click(
                          function(){
                              var form = $(this).parents("form");
                              var example = {
                                  to: form.find('[name="share-to"]').val(),
                                  message: form.find('[name="share-message"]').val(),
                                  world: world.key,
                                  program: program.key
                              };
                              var body = form.find(".body.step-1");
                              body.html(
                                  $("#templates .loading-message").clone()
                                      .find(".message").html("Sharing...").end());
                              CLIENT.addExample(
                                  example,
                                  function(example){
                                      body.remove();
                                      var link = $("<a>Click here to see your example.</a>")
                                          .attr("href", "index.html?example="+example.key+"#share")
                                          .attr("target","_blank");
                                      form.find(".body.step-2")
                                          .find("a.example-link").attr("href","index.html?example="+example.key+"#share").end()
                                          .show();
                                  });
                          }
                      );
              }
          });


      function loadExampleWorld(){
          var world = gvr.newWorld();
          gvr.world.parser.newParser(
              [
                  'Robot 2 1 E 0',
                  'Beepers 1 1 1',
                  'Wall 9 1 E 2',
                  'Wall 2 3 E 2',
                  'Wall 9 5 E 3',
                  'Wall 1 7 N 9',
                  'Wall 3 2 N 7',
                  'Wall 3 4 N 7'
              ], world).parse();

          var renderer = gvr.newRenderer('home-view-example-canvas', world);
          renderer.render();
          return {world:world, renderer:renderer};
      }

      $("#home-view-example-run-button").click(
          function(){
              var example = loadExampleWorld();
              var lines = $("#home-view-example-canvas-code").html().split("\n");
              var program = gvr.lang.parser.newParser(lines, example.world.robot).parse();

              //define a runner to run the program.
              var runner = gvr.newRunner(program, example.renderer);

              //run the program at a rate of 5 execution steps per second.
              runner.run(200);

          });


      /**
       * Setup the editor widgets to work nicely.
       */
      $(".file-description-editor")
          .blur(
              function(){
                  $(this).height(17).next().height(403);
              })
          .focus(
              function(){
                  $(this).height(100).next().height(403-100+17);
              }
          );

      /**
       * ---------------------- Navigation Setup ----------------------
       */

      function downloadView(selector){
          var view = $(selector);
          var url = view.attr("gvr:url");
          var isLoaded = view.attr("gvr:loaded");
          var alwaysReload = view.attr("gvr:alwaysReload");
          if (url && (!isLoaded || alwaysReload)){
              $("#templates .loading-message")
                  .clone().appendTo(view);
              $.get(
                  url,
                  function(content){
                      view.attr("gvr:loaded","loaded");
                      view.html(content);
                  });
          }
      }

      function selectView(selector){
          downloadView(selector);
          $(selector).show().siblings().hide();
      }
      function selectNavigationTab(selector){
          $("#navigation .selected").removeClass("selected");
          $(selector).addClass("selected");
      }
      function showBrowseView(){
          updateFileBrowser();
          selectNavigationTab($("#navigation-browse"));
          selectView("#browse-view");
      }

      function handleNavigationClick(){
          selectNavigationTab(this);
          var viewId = $(this).attr("id").replace(/^navigation-/,"")+"-view";
          selectView("#"+viewId);
      }

      $("#navigation-browse").click(updateFileBrowser);

      /**
       * ----------------- Browser History setup ------------------------
       */

      $.historyInit(
          function(hash){
              if (hash){
                  var navEl = document.getElementById("navigation-"+hash);
                  if (navEl !== null){
                      handleNavigationClick.call(navEl);
                  } else {
                      $.ajax(
                          {
                              url: hash+".html",
                              success: function(data){
                                  $("#main").html(data);
                              }
                          });
                  }
              } else {
                  handleNavigationClick.call(document.getElementById("navigation-home"));
              }
          });
      $("a[rel='history']").click(
          function(){
              $.historyLoad(this.href.replace(/^.*#/, ''));
              return false;
          }
      );

      /**
       * ----------------- Local Program/World Cache --------------------
       */
      function updateProgramCache(callback){
          CLIENT.getPrograms(
              function(programs){
                  for (var i=0; i<programs.length; i++){
                      var prog = programs[i];
                      PROGRAM_CACHE[prog.key] = prog;
                  }
                  updateFileBrowser();
                  if (typeof callback === 'function'){
                      callback();
                  }
              });
      }

      function updateWorldCache(callback){
          CLIENT.getWorlds(
              function(worlds){
                  for (var i=0; i<worlds.length; i++){
                      var wrl = worlds[i];
                      WORLD_CACHE[wrl.key] = wrl;
                  }
                  updateFileBrowser();
                  if (typeof callback === 'function'){
                      callback();
                  }
              });
      }


      /**
       * -------------------- File Browser Support ---------------------
       */
      var WORLD_TYPE = "World";
      var PROGRAM_TYPE = "Program";

      var openedWorldKey = null;
      var OpenedProgramKey = null;

      function createNewWorld(){
          function afterAdd(world){
              WORLD_CACHE[world.key] = world;
              openWorld(world);
              gvr.alert("Created new world");
          }
          CLIENT.addWorld({title: "Untitled World"}, afterAdd);
      }

      function createNewProgram(){
          function afterAdd(program){
              PROGRAM_CACHE[program.key] = program;
              openProgram(program);
              gvr.alert("Created new program");
          }
          CLIENT.addProgram({title: "Untitled Program"}, afterAdd);
      }

      /**
       * Update an editor with the given prefix to match the passed in file.
       */
      function updateEditor(file, prefix){
          $("#navigation-program").click();
          $("#"+prefix+"-editor").val(file.definition).show();
          $("#"+prefix+"-editor-title").val(file.title).show();
          $("#"+prefix+"-editor-description").val(file.description).show();
          $("#"+prefix+"-editor-pane-tab").click();
          $("#unopened-"+prefix+"-message").hide();
          if (authenticated){
              $("#save-"+prefix).removeAttr("disabled");
          }
      }

      function openWorld(world){
          updateEditor(world, "world");
          $("#world-editor-pane-tab").click();
          $("#reload-button").click();
          openedWorldKey = world.key;
      }

      function openProgram(program){
          updateEditor(program, "program");
          $("#program-editor-pane-tab").click();
          OpenedProgramKey = program.key;
      }

      function closeWorld(){
          openedWorldKey = null;
          $("#world-editor").hide();
          $("#world-editor-title").hide();
          $("#unopened-world-message").show();
          $("#save-world").attr("disabled","disabled");
      }

      function closeProgram(){
          OpenedProgramKey = null;
          $("#program-editor").hide();
          $("#program-editor-title").hide();
          $("#unopened-program-message").show();
          $("#save-program").attr("disabled","disabled");
      }

      function openFile(file){
          if (file.type === WORLD_TYPE){
              openWorld(file);
          } else {
              openProgram(file);
          }
      }

      function deleteFile(file){
          if (!confirm('Are you sure you want to delete "'+file.title+'"? This cannot be undone.')){
              return;
          }
          if (file.type === WORLD_TYPE){
              CLIENT.deleteWorld(
                  file,
                  function(){
                      if (file === getOpenedWorld()){
                          closeWorld();
                      }
                      delete WORLD_CACHE[file.key];
                      updateFileBrowser();
                      gvr.alert("Deleted "+file.title);
                  });
          } else {
              CLIENT.deleteProgram(
                  file,
                  function(){
                      if (file === getOpenedProgram()){
                          closeProgram();
                      }
                      delete PROGRAM_CACHE[file.key];
                      updateFileBrowser();
                      gvr.alert("Deleted "+file.title);
                  });
          }
      }

      function getFileFromEl(el){
          var fileEl = $(el).closest(".file");
          var key = fileEl.attr("id");
          var type = fileEl.hasClass(WORLD_TYPE) ? WORLD_TYPE : PROGRAM_TYPE;
          if (type === WORLD_TYPE){
              return WORLD_CACHE[key];
          } else {
              return PROGRAM_CACHE[key];
          }
      }

      function updateFileBrowser(){
          var files = $("#browse-pane .file-browser .files");
          files.html("");

          function addToFileList(item){
              if (!SHOW_ALL_FILES && item.owner != USER.email){
                  return;
              }
              if (SEARCH_FILES && !(item.title.toLowerCase().indexOf(SEARCH_FILES.toLowerCase())+1)){
                  return;
              }
              var isOpened = getOpenedProgram() === item || getOpenedWorld() === item;
              var fileEl = $("#templates .file-browser .file")
                  .clone()
                  .attr("id", item.key)
                  .addClass(item.type)
                  .addClass(isOpened?"opened":"")
                  .appendTo(files);

              var openFlag = isOpened?"*opened*":"";
              fileEl.find("h1")
                  .text(item.title+" "+openFlag);
              fileEl.find("p")
                  .text(item.description);


              fileEl.find(":button.open").click(function(){openFile(getFileFromEl(this));});
              fileEl.find(":button.delete").click(function(){deleteFile(getFileFromEl(this));});

          }

          for (id in PROGRAM_CACHE){
              addToFileList(PROGRAM_CACHE[id]);
          }

          for (id in WORLD_CACHE){
              addToFileList(WORLD_CACHE[id]);
          }
          files.find(".file:even").addClass("even");
      }

      /**
       * --------------------- Overrides -------------------
       */
      gvr.alert = function(text){
          return $("#alert").text(text).show().fadeOut(5000);
      };

      /**
       * ---------------------- Page initialization -------------------
       */
      CLIENT.getUser(
          function(user){

              if (!user){
                  $("#share-button").hide();
                  $("#logout-link").hide();
                  $("#login-link").show();
                  $("#program-editor-pane :input, #world-editor-pane :input,").show();
                  $("#world-editor-title").val("Temporary World");
                  $("#program-editor-title").val("Temporary Program");
                  function logon(){CLIENT.logon();}
                  $("#templates .login-to-save-message")
                      .clone()
                      .click(logon)
                      .insertAfter($("#save-program").attr("disabled","disabled"))
                      .clone()
                      .click(logon)
                      .insertAfter($("#save-world").attr("disabled","disabled"));
                  $("#templates .login-to-create-new-stuff-message")
                      .clone()
                      .click(logon)
                      .insertAfter($("#new-program"));
                  $("#new-world").attr("disabled","disabled");
                  $("#new-program").attr("disabled","disabled");
              } else {
                  USER = user;
                  authenticated = true;
                  $("#logout-link").show();
                  $("#login-link").hide();
                  $("#logon-nickname").text(user.nickname);
                  $("#program-editor-pane .toolbar-top").show();
                  $("#world-editor-pane .toolbar-top").show();


                  $("<a href=\"javascript:void(0)\">create a new program</a>")
                      .click(createNewProgram)
                      .insertAfter(
                          $("<span> or <span>")
                              .insertAfter(
                                  $("<a href=\"javascript:void(0)\">Browse existings programs</a>")
                                      .click(showBrowseView)
                                      .insertAfter(
                                          $("<div>No program is open.</div>")
                                              .appendTo("#unopened-program-message"))));

                  $("<a href=\"javascript:void(0)\">create a new world</a>")
                      .click(createNewWorld)
                      .insertAfter(
                          $("<span> or <span>")
                              .insertAfter(
                                  $("<a href=\"javascript:void(0)\">Browse existings worlds</a>")
                                      .click(showBrowseView)
                                      .insertAfter(
                                          $("<div>No world is open.</div>")
                                              .appendTo("#unopened-world-message"))));
              }
              updateProgramCache();
              updateWorldCache();
          });

      updateExecutionButtons();
      $("#reload-button").click();
      $("#show-my-files").click(
          function(){
              $(this).hide();
              $("#show-all-files").show();
              SHOW_ALL_FILES = false;
              updateFileBrowser();
          });
      $("#show-all-files").click(
          function(){
              $(this).hide();
              $("#show-my-files").show();
              SHOW_ALL_FILES = true;
              updateFileBrowser();
          });
      $("#search-files :input").keyup(
          function(){
              SEARCH_FILES = $(this).val();
              updateFileBrowser();
          });
      loadExampleWorld();

      // setup translation stuff
      $.each(
          gvr.i18n.translationMap,
          function(locale, localeTranslation){
              //console.log("got locale",locale,"and translation",localeTranslation);
              $("#language-selector")
                  .append('<option value="'+locale+'">'+localeTranslation.name+'</option>');
          });
      $("#language-selector").val(gvr.i18n.getBrowserLocale());
      $("#language-selector").change(
          function(){
              gvr.i18n.locale = $(this).val();
              translate();
          });
      translate();
  });

function translate(){
    var _ = gvr.i18n.newTranslatedString;
    $("._").each(
        function(){
            var messageId = $(this).attr("i18n:id");
            $(this).html(_(messageId, $.trim($(this).html())).toString());
        });
}


function i18nExtract(){
    var missing = {};
    $("._").each(
        function(){
            var _ = gvr.i18n.newTranslatedString;
            var messageId = $(this).attr("i18n:id");
            if (!gvr.i18n.newTranslatedString(messageId).getTranslation()){
                missing[messageId] = $.trim($(this).html());
            }
        });
    $.getScript(
        "http://www.json.org/json2.js",
        function(){
            //console.log(JSON.stringify(missing).replace(/","/g,'",\n"'));
        });


    return missing;
}