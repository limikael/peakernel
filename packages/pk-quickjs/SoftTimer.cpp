#include "SoftTimer.h"

#if defined(ARDUINO)
#include <Arduino.h>
#elif defined(ESP_PLATFORM)
#include "esp_timer.h"
static int millis() {
    int64_t ms=esp_timer_get_time()/1000;
    return ms;
}
#else
#error "Uknown platform"
#endif

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
