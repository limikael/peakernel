#include "Fs.h"

std::shared_ptr<Fs> Fs::getInstance() {
	static std::shared_ptr<Fs> instance=nullptr;

	if (instance==nullptr)
		instance=std::shared_ptr<Fs>(new Fs());

	return instance;
}

std::shared_ptr<Fs> Fs::createForTesting() {
	return std::shared_ptr<Fs>(new Fs());
}

std::shared_ptr<Fs> getFsInstance() {
	return Fs::getInstance();
}
