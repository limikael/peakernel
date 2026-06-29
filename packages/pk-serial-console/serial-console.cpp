#if defined(ARDUINO)
#include "serial-console-arduino.cpp"
#elif defined(ESP_PLATFORM)
#include "serial-console-esp.cpp"
#else
#error "Unsupported platform for serial console"
#endif
