#include "Net.h"
#include <cstring>
#include "nvs_flash.h"

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

        if (status==Net::CONNECTED)
            record->setString("wifiIp",ip);
	});
#endif

    esp_err_t err = nvs_flash_init();

    if (err == ESP_ERR_NVS_NO_FREE_PAGES ||
        err == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }

    ESP_ERROR_CHECK(err);

    esp_netif_init();
    esp_event_loop_create_default();

    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(
        esp_event_handler_register(
            WIFI_EVENT,
            ESP_EVENT_ANY_ID,
            &Net::wifiEventHandler,
            this));

    ESP_ERROR_CHECK(
        esp_event_handler_register(
            IP_EVENT,
            IP_EVENT_STA_GOT_IP,
            &Net::wifiEventHandler,
            this));

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_start());
}

void Net::loop() {
}

void Net::setCredentials(std::string ssid_, std::string password_) {
    if (ssid == ssid_ &&
        	password == password_)
        return;

    ssid = std::move(ssid_);
    password = std::move(password_);

    wifi_config_t config = {};

    strncpy((char *)config.sta.ssid,
            ssid.c_str(),
            sizeof(config.sta.ssid));

    strncpy((char *)config.sta.password,
            password.c_str(),
            sizeof(config.sta.password));

    esp_wifi_disconnect();

    ESP_ERROR_CHECK(
        esp_wifi_set_config(WIFI_IF_STA, &config));

    esp_wifi_connect();

    updateStatus(CONNECTING);
}

void Net::updateStatus(Status newStatus) {
	if (newStatus!=status) {
		//Serial.printf("wifi status change... Wifi.status()=%d\n",WiFi.status());
		status=newStatus;
		statusChangeEvent.emit();
	}
}

void Net::wifiEventHandler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data) {
    Net *self = static_cast<Net *>(arg);

    if (event_base == WIFI_EVENT) {
        switch (event_id) {
            case WIFI_EVENT_STA_START:
                self->ip="";
                self->updateStatus(CONNECTING);
                break;

            case WIFI_EVENT_STA_CONNECTED:
                self->ip="";
                self->updateStatus(CONNECTING);
                break;

            case WIFI_EVENT_STA_DISCONNECTED:
                self->ip="";
                self->updateStatus(DISCONNECTED);
                esp_wifi_connect();     // optional auto reconnect
                break;
        }
    }

    if (event_base==IP_EVENT &&
        	event_id==IP_EVENT_STA_GOT_IP) {
        auto *event = (ip_event_got_ip_t *)event_data;
        char buf[16];
        snprintf(buf, sizeof(buf), IPSTR, IP2STR(&event->ip_info.ip));
        self->ip=buf;
        self->updateStatus(CONNECTED);
    }
}