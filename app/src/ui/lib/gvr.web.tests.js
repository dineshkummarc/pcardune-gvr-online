var gvr = gvr || {};
gvr.web = gvr.web || {};
gvr.web.tests = {};

(function($){

     var assert = gvr.tests.assert;
     var assertEquals = gvr.tests.assertEquals;
     var assertNotEqual = gvr.tests.assertNotEqual;

     jQuery.ajaxSetup({async: false});

     $.TestClient = {
         getClient: function(){
             return gvr.web.client.newClient();
         },

         testConstructor: function(){
             gvr.web.client.newClient();
         },

         testGetUser: function(){
             var client = this.getClient();
             client.getUser(
                 function(user){
                     if (user === null){
                         client.logon();
                     }
                 });
         },

         testCRUDExample: function(){
             var client = this.getClient();
             client.addProgram(
                 {
                     title:"My Program",
                     description:"Some Program",
                     definition: "move"
                 },
                 function (program){
                     client.addWorld(
                         {
                             title:"My World",
                             description:"Some World",
                             definition: "Robot 1 1 N 1"
                         },
                         function(world){
                             client.addExample(
                                 {
                                     message: "Simple Example of a World and Program",
                                     world: world.key,
                                     program: program.key
                                 },
                                 function(example){
                                     assertEquals(example.message, "Simple Example of a World and Program");
                                     assertEquals(example.world.title, "My World");
                                     assertEquals(example.program.title, "My Program");
                                 });
                         });
                 });
         },

         testCRUDProgram: function(){
             var client = this.getClient();
             var programKey = null;
             //create a program
             client.addProgram(
                 {
                     title:"My Program",
                     description:"Some Program",
                     definition: "move"
                 },
                 function(program){
                     assertEquals(program.title, "My Program");
                     assertEquals(program.description, "Some Program");
                     assertEquals(program.definition, "move");

                     // read a program
                     client.getProgram(
                         program.key,
                         function(program){
                             assertEquals(program.title, "My Program");
                             assertEquals(program.description, "Some Program");
                             assertEquals(program.definition, "move");
                             program.title = "My New Program";
                             program.description = "Same program, just different";
                             program.definition = "turnleft";

                             // update a program
                             client.saveProgram(
                                 program,
                                 function(prog){
                                     assertEquals(prog.title, "My New Program");
                                     assertEquals(prog.description, "Same program, just different");
                                     assertEquals(prog.definition, "turnleft");

                                     // delete a program
                                     client.deleteProgram(
                                         prog,
                                         function(data){
                                             client.getPrograms(
                                                 function(programs){
                                                     for (var i=0; i < programs.length; i++){
                                                         assert(programs[i].key != prog.key);
                                                     }
                                                 });
                                         }
                                     );
                                 }
                             );
                         });
                 });
         },

         testCRUDWorld: function(){
             var client = this.getClient();
             var worldKey = null;
             // create a world
             client.addWorld(
                 {
                     title:"My World",
                     description:"Some World",
                     definition: "Robot 1 1 N 1"
                 },
                 function(world){
                     assertEquals(world.title, "My World");
                     assertEquals(world.description, "Some World");
                     assertEquals(world.definition, "Robot 1 1 N 1");

                     // read a world
                     client.getWorld(
                         world.key,
                         function(world){
                             assertEquals(world.title, "My World");
                             assertEquals(world.description, "Some World");
                             assertEquals(world.definition, "Robot 1 1 N 1");
                             world.title = "My New World";
                             world.description = "Same world, just different";
                             world.definition = "World 5 5 S 4";
                             // update a world
                             client.saveWorld(
                                 world,
                                 function(prog){
                                     assertEquals(prog.title, "My New World");
                                     assertEquals(prog.description, "Same world, just different");
                                     assertEquals(prog.definition, "World 5 5 S 4");
                                     // delete a world
                                     client.deleteWorld(
                                         prog,
                                         function(data){
                                             client.getWorlds(
                                                 function(worlds){
                                                     for (var i=0; i < worlds.length; i++){
                                                         assertNotEqual(worlds[i].key !== prog.key);
                                                     }
                                                 });
                                         }
                                     );
                                 }
                             );
                         });
                 });
         }






     };

 })(gvr.web.tests);