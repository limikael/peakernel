#pragma once
#include <memory>
#include "async_primitives.hpp"

#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_err.h"

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
    static void wifiEventHandler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data);
    void updateStatus(Status newStatus);
	//Status getHardwareStatus();
	std::string ssid,password;
	Status status;
	std::string ip;
};
