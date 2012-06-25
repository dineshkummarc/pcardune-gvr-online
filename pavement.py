import urllib2
import os
import shutil
import sys

from paver.easy import *
from paver.path import path
import paver.doctools
from paver.setuputils import setup

options(
    virtualenv=dict(
        script_name="bootstrap.py",
        paver_command_line="init",
        ))

def cmd(c, silent=False):
    if not silent:
        print c
    os.system(c)

def download(url, filepath=None):
    if filepath is None:
        filepath = url.split('/')[-1]
    print "downloading %s to %s" % (url, filepath)
    open(filepath,'w').write(urllib2.urlopen(url).read())

def unzip(path):
    cmd("unzip -uq %s" % path)

def rm(path):
    cmd("rm -rf %s" % path)

@task
def getclosure():
    """Download the closure js library and compiler"""
    if os.path.isdir("closure"):
        print "Updating closure"
        cmd("svn up closure")
    else:
        print "Checking out closure for the first time."
        cmd("svn co http://closure-library.googlecode.com/svn/trunk closure")

    compiler = path("compiler")
    if not compiler.exists():
        compiler.mkdir()
    if (compiler/"compiler-latest.zip").exists():
        rm(compiler/"compiler-latest.zip")
    if (compiler/"compiler.jar").exists():
        rm(compiler/"compiler.jar")
    download("http://closure-compiler.googlecode.com/files/compiler-latest.zip",
             compiler/"compiler-latest.zip")
    os.chdir(compiler.abspath())
    unzip("compiler-latest.zip")
    rm("compiler-latest.zip")
    os.chdir("..")

@task
def getwaveapi():
    """Checkout/update the waveapi."""
    waveapi = path("app/src/waveapi")
    if os.path.exists(waveapi):
        cmd("svn up %s" % waveapi)
    else:
        cmd("svn co http://wave-robot-python-client.googlecode.com/svn/trunk/src/waveapi %s"%waveapi)

@task
def getappengine():
    """Download Google App Engine"""
    if os.path.exists("google_appengine_1.3.1.zip"):
        rm("google_appengine_1.3.1.zip")
    if os.path.isdir("google_appengine"):
        rm("google_appengine")
    cmd("wget http://googleappengine.googlecode.com/files/google_appengine_1.3.1.zip")
    unzip("google_appengine_1.3.1.zip")
    rm("google_appengine_1.3.1.zip")

@task
def getjsdoc():
    """Download the jsdoc toolkit"""
    filepath = os.path.join("tools","jsdoc_toolkit-2.1.0")
    if os.path.exists(filepath):
        print "already downloaded jsdoc toolkit"
        return
    download("http://jsdoc-toolkit.googlecode.com/files/jsdoc_toolkit-2.1.0.zip")
    unzip("jsdoc_toolkit-2.1.0.zip")
    os.remove("jsdoc_toolkit-2.1.0.zip")
    os.rename("jsdoc_toolkit-2.1.0", filepath)

@task
def builddeps():
    """Generate a deps.js file for use with closure."""
    calcdeps = path('closure/closure/bin/calcdeps.py').abspath()
    cwd = path(os.curdir).abspath()
    os.chdir(path("app/src/ui"))
    cmd("python %s -p lib -o deps > deps.js" % calcdeps)
    os.chdir(cwd)

@task
def compile():
    """Compile the javascript using closure compiler"""
    calcdeps = path('closure/closure/bin/calcdeps.py').abspath()
    compiler = path('compiler/compiler.jar').abspath()
    launcher = path('app/src/ui/launcher.js').abspath()
    cwd = path(os.curdir).abspath()
    os.chdir(path("app/src/ui"))
    cmd("python %s -i %s -p lib -o compiled -c %s "
        '-f "--externs=lib/externs.js" '
#        '-f "--externs=lib/externs.js --compilation_level=ADVANCED_OPTIMIZATIONS" '
        "> compiled.js" %
        (calcdeps, launcher, compiler))
    os.chdir(cwd)

@task
def init():
    """Initialize everything so you can start working"""
    getappengine()
    getclosure()
    getjsdoc()

@task
def docs():
    """Generate all the documentation"""
    jsdocpath = path('tools') / 'jsdoc_toolkit-2.1.0' / 'jsdoc-toolkit'
    jsrunpath = jsdocpath / 'jsrun.jar'
    runpath = jsdocpath / 'app' / 'run.js'
    templatepath = path("doc-template")
    libpath = path("app") / "src" / "ui" / "lib"
    docspath = path("app") / "src" / "ui" / "docs"
    def builddoc(path):
        print "building docs for:%s" % path
        cmd("java -jar %s %s -p -a -d=docs -t=%s %s" % (
            jsrunpath, runpath, templatepath, path),
            silent=False)

    paths = ' '.join([f for f in libpath.files("gvr*.js") if "test" not in f])
    cmd("java -jar %s %s -p -a -d=%s -t=%s %s" % (
        jsrunpath, runpath, docspath, templatepath, paths))

@task
def run():
    """Run the google app engine development server against gvr-online"""
    cmd("google_appengine/dev_appserver.py --enable_sendmail app")

@task
def lint():
    LIB_HOME = path('app/src/ui/lib')
    JSLINT = path('tools/jslint.js')

    def test(inFile):
        cmd = 'rhino %s %s' % (JSLINT, inFile)
        stdin, stdout, stderr = os.popen3(cmd)
        err = stderr.read()
        if err:
            sys.stderr.write(err)
        result = stdout.read()
        if "No problems found" not in result:
            return result

    files = LIB_HOME.files("gvr.*.js")
    errors = {};
    for filepath in files:
        error = test(filepath)
        if error:
            sys.stdout.write('E')
            errors[filepath] = error
        else:
            sys.stdout.write('.')
        sys.stdout.flush()

    print
    print len(errors), "out of", len(files), "files have errors"
    if len(errors) > 0:
        print
        for fn, e in errors.items():
            print "="*70
            print fn
            print "="*70
            print e
        sys.exit(1)


@task
def deploy():
    """Deploy to google app engine."""
    docs()
    cmd("google_appengine/appcfg.py update app")
