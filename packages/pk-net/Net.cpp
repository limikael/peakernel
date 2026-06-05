#include "Net.h"
#include "WiFi.h"

#ifdef ARDUINO
#include <Arduino.h>
#endif

#ifdef PEAKERNEL_INFO
#include "InfoRecord.h"
#endif

std::shared_ptr<Net> Net::getInstance() {
	static std::shared_ptr<Net> instance=nullptr;

	if (instance==nullptr)
		instance=std::shared_ptr<Net>(new Net());

	return instance;
}

void Net::setup() {
#ifdef PEAKERNEL_INFO
	InfoCollector::getInstance()->collectEvent.on([this](std::shared_ptr<InfoRecord> record) {
		switch (status) {
			case Net::CONNECTED:
				record->setString("wifiStatus","connected");
				break;

			case Net::DISCONNECTED:
				record->setString("wifiStatus","disconnected");
				break;

			case Net::CONNECTING:
				record->setString("wifiStatus","connecting");
				break;
		}
	});
#endif
}

void Net::loop() {
	updateStatus();
}

void Net::setCredentials(std::string ssid_, std::string password_) {
	if (ssid_==ssid && password_==password)
		return;

	ssid=ssid_;
	password=password_;

	/*WiFi.disconnect();
	delay(100);*/
	WiFi.begin(ssid.c_str(),password.c_str());

	updateStatus();

	//Serial.printf("credentials change...\n");
}

void Net::updateStatus() {
	Status hardwareStatus=getHardwareStatus();
	if (hardwareStatus!=status) {
		status=hardwareStatus;
		statusChangeEvent.emit();
	}
}

Net::Status Net::getHardwareStatus() {
	switch (WiFi.status()) {
		case WL_CONNECTED:
			return Net::CONNECTED;
			break;

		case WL_IDLE_STATUS:
			return Net::CONNECTING;
			break;

		default:
			return Net::DISCONNECTED;
	}
}