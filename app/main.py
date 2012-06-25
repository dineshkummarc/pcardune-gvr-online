import sys
import os.path

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

DIR_PATH = os.path.abspath(os.path.dirname(os.path.realpath(__file__)))
sys.path = [os.path.join(DIR_PATH, 'src')] + sys.path


from gvrweb import handler

application = webapp.WSGIApplication(
    [('/', handler.AppForward),
     ('/api/', handler.MainPage),
     ('/api/programs', handler.Programs),
     ('/api/programs/(.*)', handler.Program),
     ('/api/delete/(.*)', handler.DeleteEntity),
     ('/api/worlds', handler.Worlds),
     ('/api/worlds/(.*)', handler.World),
     ('/api/examples', handler.ExamplePages),
     ('/api/examples/(.*)', handler.ExamplePage),
     ('/api/user', handler.User),
     ('/api/logon', handler.LogonRedirect),
     ('/api/logout', handler.LogoutRedirect),
     ],
    debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
