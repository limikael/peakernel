#if defined(ARDUINO)
#include "Net-arduino.cpp"
#elif defined(ESP_PLATFORM)
#include "Net-esp.cpp"
#else
#error "Unsupported platform for net"
#endif
