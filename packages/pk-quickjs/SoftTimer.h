#pragma once

#ifdef ARDUINO
#include <Arduino.h>
#endif

class SoftTimer {
private:
    unsigned long interval;
    unsigned long previous;
    bool firstRun;
    
public:
    SoftTimer(unsigned long ms);
    unsigned long tick();
    void reset();
    void setInterval(unsigned long ms);
    //bool expired() const;
};
