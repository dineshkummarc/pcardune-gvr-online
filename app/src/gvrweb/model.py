from google.appengine.ext import db
from google.appengine.api import users

class JsonModel(db.Model):

    def json(self):
        result = dict(
            key=str(self.key()),
            type=self.__class__.__name__,)

        for key, prop in self.properties().items():
            value = getattr(self, key)
            if isinstance(prop, (db.StringProperty, db.TextProperty, db.BooleanProperty)):
                result[key] = value
            elif isinstance(prop, db.UserProperty):
                result[key] = value.email()
        return result


class World(JsonModel):
    title = db.StringProperty(required=True)
    description = db.TextProperty(required=False)
    owner = db.UserProperty(required=True, auto_current_user_add=True)
    definition = db.TextProperty()


class Program(JsonModel):
    title = db.StringProperty(required=True)
    description = db.TextProperty(required=False)
    owner = db.UserProperty(required=True, auto_current_user_add=True)
    definition = db.TextProperty()


class ExamplePage(JsonModel):
    owner = db.UserProperty(required=True, auto_current_user_add=True)
    world = db.ReferenceProperty(reference_class=World, required=True)
    program = db.ReferenceProperty(reference_class=Program, required=True)
    message = db.TextProperty(required=False)

    def json(self):
        data = super(ExamplePage, self).json()
        data['world'] = self.world.json()
        data['program'] = self.program.json()
        return data
