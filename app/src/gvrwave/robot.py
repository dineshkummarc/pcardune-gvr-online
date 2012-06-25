import logging

from waveapi import events
from waveapi import model
from waveapi.robot import Robot

class GvrBot(Robot):
    """The GvR Google Wave Robot."""

    def configure(self):
        """Set up all the handlers"""
        self.RegisterHandler(events.WAVELET_SELF_ADDED, self.on_robot_added)
        self.RegisterHandler(events.WAVELET_PARTICIPANTS_CHANGED, self.on_robot_added)
        self.RegisterHandler(events.BLIP_SUBMITTED, self.on_blip_submitted)


    def notify(self, context):
        root_wavelet = context.GetRootWavelet()
        root_wavelet.CreateBlip().GetDocument().SetText("Hi everybody!")

    def on_blip_submitted(self, properties, context):
        """Called when a blip is submitted."""
        logging.debug("Caught blip submitted event")
        root_wavelet = context.GetRootWavelet()
        root_wavelet.CreateBlip().GetDocument().SetText("Looks like a blip got submitted.")

    def on_robot_added(self, properties, context):
        """Called when this robot is added to a wave."""
        logging.debug("Caught robot added event")
        root = context.GetRootWavelet()
        root.CreateBlip().GetDocument().SetText("Hi from the GvR Robot!")

    def on_participants_changed(self, properties, context):
        """Called when participants are added/removed from a wave."""
        logging.debug("Caught a participants changed event")
        added = properties['participantsAdded']
        for p in added:
            self.notify(context)
