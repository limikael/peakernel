#include "SoftTimer.h"

// Constructor
SoftTimer::SoftTimer(unsigned long ms) 
    : interval(ms), previous(0), firstRun(true) {
}

// Main tick function
unsigned long SoftTimer::tick() {
    unsigned long current = millis();
    unsigned long delta = 0;
    
    // Handle first run
    if (firstRun) {
        previous = current;
        firstRun = false;
        return 0;
    }
    
    // Check if interval has passed
    if (current - previous >= interval) {
        delta = current - previous;
        previous = current;
        return delta;
    }
    
    return 0; // Interval hasn't passed yet
}

// Reset the timer
void SoftTimer::reset() {
    firstRun = true;
}

// Change interval dynamically
void SoftTimer::setInterval(unsigned long ms) {
    interval = ms;
}

// Check if interval has passed without resetting
bool SoftTimer::expired() const {
    if (firstRun) return true; // Consider expired on first run
    return (millis() - previous >= interval);
}