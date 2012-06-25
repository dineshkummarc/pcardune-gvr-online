import simplejson

from google.appengine.api import users, mail
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.ext.webapp import RequestHandler

import model


class JsonRequestHandler(RequestHandler):
    '''Helper base class that serializes python objects to json when writing'''

    def write(self, json):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

    def writeObject(self, obj):
        if isinstance(obj, str):
            obj = db.get(obj)
        self.write(obj.json())

    def getData(self):
        return simplejson.loads(self.request.body)


class AppForward(RequestHandler):
    '''Simple handler that forwards to the ui index.html page.'''

    def get(self):
        self.redirect(self.request.uri+'ui/index.html')


class MainPage(RequestHandler):
    '''Just an example page.'''

    def get(self):
        user = users.get_current_user()

        if user:
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('Hello, ' + user.nickname())
            self.response.out.write("body:"+self.request.body)
        else:
            self.redirect(users.create_login_url(self.request.uri))


class User(JsonRequestHandler):

    def get(self):
        user = users.get_current_user()
        if user:
            self.write(dict(email=user.email(),
                            nickname=user.nickname()))
        else:
            self.write(None)


class LogonRedirect(RequestHandler):

    def get(self):
        self.redirect(users.create_login_url(self.request.get('nextURL')))

class LogoutRedirect(RequestHandler):

    def get(self):
        self.redirect(users.create_logout_url(self.request.get('nextURL','/')))

class Programs(JsonRequestHandler):
    '''Handler that returns a json representation of all programs.'''

    def get(self):
        '''Return json representation of all programs'''
        programs = db.GqlQuery("SELECT * FROM Program")
        self.write([program.json() for program in programs])

    def post(self):
        '''Add a new program given a json representation'''
        program = model.Program(title=self.request.get('title'),
                                description=self.request.get('description'),
                                definition=self.request.get('definition'))
        program.put()
        self.write(program.json())


class Program(JsonRequestHandler):

    get = JsonRequestHandler.writeObject

    def post(self, key):
        program = db.get(key)
        program.title = self.request.get('title')
        program.description = self.request.get('description')
        program.definition = self.request.get('definition')
        program.put()
        self.write(program.json())


class DeleteEntity(RequestHandler):

    def get(self, key):
        '''Delete the entity with the given key'''
        db.delete(key)
        self.response.out.write("OK")


class Worlds(JsonRequestHandler):

    def get(self):
        '''Returns json representation of all worlds'''
        worlds = db.GqlQuery("SELECT * FROM World")
        self.write([world.json() for world in worlds])

    def post(self):
        '''Add a new world given a json representation'''
        world = model.World(title=self.request.get('title'),
                            description=self.request.get('description'),
                            definition=self.request.get('definition'))
        world.put()
        self.write(world.json())


class World(JsonRequestHandler):

    get = JsonRequestHandler.writeObject

    def post(self, key):
        world = db.get(key)
        world.title = self.request.get('title')
        world.description = self.request.get('description')
        world.definition = self.request.get('definition')
        world.put()
        self.write(world.json())


class ExamplePages(JsonRequestHandler):

    def get(self):
        '''Returns json representation of al example pages.'''
        examples = db.GqlQuery("SELECT * FROM ExamplePage")
        self.write([example.json() for example in examples])

    def post(self):
        example = model.ExamplePage(
            message=self.request.get('message'),
            world=db.get(self.request.get('world')),
            program=db.get(self.request.get('program')))
        example.put()

        url = "http://gvr.carduner.net/ui/index.html?example=%s#share" % example.key()

        if self.request.get('to'):
            receivers = map(lambda s: s.strip(), self.request.get('to').split(','))
            user = users.get_current_user()
            for receiver in receivers:
                mail.send_mail(
                    sender=user.email(),
                    to=receivers,
                    subject="I'd like to share a GvR program with you",
                    body="""
I've shared a GvR program with you!

To view the program click the link below.

  %s

The program is called %s and here is my message to you:

%s
""" % (url, example.program.title, example.message))

        self.write(example.json())


class ExamplePage(JsonRequestHandler):

    get = JsonRequestHandler.writeObject

    def post(self, key):
        example = db.get(key)
        example.message = self.request.get('message')
        example.description = db.get(self.request.get('world'))
        example.definition = db.get(self.request.get('program'))
        example.put()
        self.write(example.json())
