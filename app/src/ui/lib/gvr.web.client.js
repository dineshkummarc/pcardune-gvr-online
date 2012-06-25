/**
 * @name gvr.web
 * @namespace namespace for everything related to the website.
 */

/**
 * @name gvr.web.client
 * @namespace namespace for everything related to talking to the backend service.
 */
goog.provide("gvr.web.client");
goog.require("gvr.core");

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
};