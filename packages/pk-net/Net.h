#pragma once
#include <memory>
#include "async_primitives.hpp"

class Net {
public:
	enum Status {
		DISCONNECTED, CONNECTING, CONNECTED
	};

	void loop();
	void setup();
	static std::shared_ptr<Net> getInstance();
	void setCredentials(std::string ssid_, std::string password_);
	Status getStatus() { return status; }

	Dispatcher<> statusChangeEvent;

private:
	void updateStatus();
	Status getHardwareStatus();
	std::string ssid,password;
	Status status;
};
