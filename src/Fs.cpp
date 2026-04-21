#include "Fs.h"

FileHandle::FileHandle() {
	drainOnTick=true;
}

void FileHandle::write(std::vector<uint8_t> data) {
	assert(!isClosed());
	auto otherShared=other.lock();
	assert(otherShared!=nullptr);
	assert(!otherShared->isClosed());
	otherShared->handleIncoming(data);
}

std::vector<uint8_t> FileHandle::read() {
	assert(buffered);
	if (!readBuffer.size() && !isClosed()) {
		auto otherShared=other.lock();
		otherShared->drainEvent.emit();
	}

	std::vector<uint8_t> data=readBuffer;
	readBuffer.clear();
	return data;
}

void FileHandle::tick() {
	if (drainOnTick && !isClosed()) {
		drainEvent.emit();
		drainOnTick=false;
	}

	if (haveNewData) {
		haveNewData=false;
		if (buffered) {
			std::vector<uint8_t> empty;
			dataEvent.emit(empty);
		}

		else {
			dataEvent.emit(readBuffer);
			readBuffer.clear();
			auto otherShared=other.lock();
			otherShared->drainOnTick=true;
		}
	}
}

void FileHandle::close() {
	if (closed)
		return;

	closed=true;
	other.lock()->close();
}

void FileHandle::handleIncoming(std::vector<uint8_t> data) {
	readBuffer.insert(readBuffer.end(), data.begin(), data.end());
	haveNewData=true;
}

void FileHandle::setBuffered(bool b) {
	buffered=b;
	auto otherShared=other.lock();
	assert(otherShared);

	if (buffered)
		otherShared->drainOnTick=false;

	else
		otherShared->drainOnTick=true;
}

FileHandlePair::FileHandlePair() {
	first=std::make_shared<FileHandle>();
	second=std::make_shared<FileHandle>();
	first->setOther(second);
	second->setOther(first);
}

void FileHandlePair::tick() {
	first->tick();
	second->tick();
}

void FileHandlePair::close() {
	first->close();
	second->close();
}

OpenEvent::OpenEvent(std::shared_ptr<FileHandlePair> pair_, std::string pathname_, std::string mode_) {
	pair=pair_;
	pathname=pathname_;
	mode=mode_;
}

std::shared_ptr<FileHandle> OpenEvent::accept() {
	if (accepted)
		return nullptr;

	accepted=true;
	return pair->getSecond();
}

std::shared_ptr<FileHandlePair> Fs::createFileHandlePair() {
	std::shared_ptr<FileHandlePair> pair=std::make_shared<FileHandlePair>();
	pairs.push_back(pair);
	return pair;
}

std::shared_ptr<FileHandle> Fs::open(std::string pathname, std::string mode) {
	auto fp=createFileHandlePair();
	auto ev=std::make_shared<OpenEvent>(fp, pathname, mode);
	openRequest.emit(ev);

	if (ev->isAccepted()) {
		return fp->getFirst();
	}

	else {
		fp->close();
		return nullptr;
	}
}

void Fs::tick() {
	for (auto fp: pairs)
		fp->tick();

	pairs.erase(
	    std::remove_if(
	        pairs.begin(),
	        pairs.end(),
	        [](const std::shared_ptr<FileHandlePair>& p) {
	        	if (p->isClosed()) {
					p->getFirst()->closeEvent.emit();
					p->getSecond()->closeEvent.emit();
	        	}
	            return p->isClosed();
	        }
	    ),
	    pairs.end()
	);
}

void Fs::close() {
	tick();

	for (auto fp: pairs)
		fp->close();

	tick();
}

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
