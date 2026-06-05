#include "Net.h"

std::shared_ptr<Net> Net::getInstance() {
	static std::shared_ptr<Net> instance=nullptr;

	if (instance==nullptr)
		instance=std::shared_ptr<Net>(new Net());

	return instance;
}

void Net::loop() {
	
}