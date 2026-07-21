#if defined(ARDUINO)
#include <LittleFS.h>
#include "pk-littlefs-arduino.cpp"
#elif defined(ESP_PLATFORM)
#include "pk-littlefs-esp.cpp"
#else
#error "Unsupported platform for littlefs"
#endif
