#pragma once
#include <string>

extern "C" {

void runtime_setup();
void runtime_loop();
void runtime_start();
void runtime_stop();

}

void serialWriteString(std::string s);