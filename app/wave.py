import sys
import os.path
import logging

DIR_PATH = os.path.abspath(os.path.dirname(os.path.realpath(__file__)))
sys.path = [os.path.join(DIR_PATH, 'src')] + sys.path


from gvrwave import robot

if __name__ == '__main__':
    logging.info("Instantiating GvRBot")
    gvrBot = robot.GvrBot('gvr-online',
                          #image_url='',
                          version='2',
                          profile_url='http://gvr-online.appspot.com/')
    gvrBot.configure()
    gvrBot.Run()
