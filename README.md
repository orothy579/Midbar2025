# MQTT Test Application

This document outlines the MQTT topics used for controlling devices and managing IO.

## Control

pub -> cmd led, fan on/off [control topic]

sub <- datas (sensing, led, fan) [sensor topic , IO topic]

## IO

pub -> sensing data(temp, humid, co2) [sensor topic]
pub -> led, fan data (led, fan)  [IO topic]

sub <- cmd led, fan on/off [control topic]
