#pragma once
#include <memory>

class Net {
public:
	void loop();
	static std::shared_ptr<Net> getInstance();
};
