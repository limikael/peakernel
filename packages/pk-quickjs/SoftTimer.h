#pragma once
#include <Arduino.h>

class SoftTimer {
private:
    unsigned long interval;
    unsigned long previous;
    bool firstRun;
    
public:
    // Constructor
    SoftTimer(unsigned long ms);
    
    // Main tick function - returns actual elapsed time if interval has passed
    unsigned long tick();
    
    // Reset the timer
    void reset();
    
    // Change interval dynamically
    void setInterval(unsigned long ms);
    
    // Check if interval has passed without resetting
    bool expired() const;
};
