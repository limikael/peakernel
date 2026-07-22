#include "fetch.h"
#include "esp_http_client.h"
#include "esp_crt_bundle.h"
#include "async_primitives.hpp"

Promise<std::shared_ptr<Response>> fetch(std::string url) {
	printf("fetch... %s\n",url.c_str());
    std::string responseText;

	esp_http_client_config_t config = {};

	//https not working for now...
	//config.crt_bundle_attach = esp_crt_bundle_attach;
	config.url=url.c_str();

	esp_http_client_handle_t client=esp_http_client_init(&config);
	esp_http_client_open(client,0);
	esp_http_client_fetch_headers(client);

	char buffer[512];
	int len;

	while ((len = esp_http_client_read(client, buffer, sizeof(buffer))) > 0) {
	    responseText.append(buffer, len);
	}

	esp_http_client_close(client);
	esp_http_client_cleanup(client);

	Promise<std::shared_ptr<Response>> p;
	p.resolve(Response::fromText(responseText));

	return p;
}

Promise<std::string> Response::text() {
	Promise<std::string> p;
	p.resolve(responseText);

	return p;
}

std::shared_ptr<Response> Response::fromText(std::string s) {
	return std::make_shared<Response>(s);
}
