#include "Fs.h"

FileHandle::FileHandle() {
	/*Serial.printf("FileHandle constructor...\n");*/
	drainOnTick=true;
}

void FileHandle::write(std::vector<uint8_t> data) {
	if (isClosed() || isClosing())
		return;

	auto otherShared=other.lock();
	if (!otherShared)
		return;

	otherShared->handleIncoming(data);
}

void FileHandle::tick() {
	if (isClosed())
		return;

	if (isClosing() && !readBuffer.size() && !isClosed()) {
		this->close();
		//Serial.printf("emitting close..\n");
		this->closeEvent.emit();
	}

	if (drainOnTick && !isClosed() && !isClosing())
		drainEvent.emit();

	drainOnTick=false;
	if (readBuffer.size() && dataEventSize) {
		if (dataEventSize>0 && dataEventSize<readBuffer.size()) {
			std::vector<uint8_t> tosend(
				readBuffer.begin(),
				readBuffer.begin()+dataEventSize
			);

			readBuffer.erase(
				readBuffer.begin(),
                readBuffer.begin()+dataEventSize
            );

			dataEvent.emit(tosend);
		}

		else {
			dataEvent.emit(readBuffer);
			readBuffer.clear();
		}

		auto otherShared=other.lock();
		if (otherShared)
			otherShared->drainOnTick=true;
	}
}

void FileHandle::setDataEventSize(int v) { 
	dataEventSize=v;
	auto otherShared=other.lock();
	if (otherShared && !isClosing())
		otherShared->drainOnTick=true;
}

void FileHandle::close() {
	closed=true;
}

void FileHandle::forceClose() {
	if (readBuffer.size()) {
		dataEvent.emit(readBuffer);
		readBuffer.clear();
	}

	closeEvent.emit();
	close();
}

void FileHandle::handleIncoming(std::vector<uint8_t> data) {
	readBuffer.insert(readBuffer.end(), data.begin(), data.end());
}

bool FileHandle::isClosing() {
	auto otherShared=other.lock();
	if (!otherShared)
		return true;

	return otherShared->isClosed();
}

int FileHandle::getDataWriteAdviceSize() {
    auto otherShared=other.lock();
    if (!otherShared)
        return 0;

    return otherShared->getIncomingCapacity();
}

int FileHandle::getIncomingCapacity() {
    if (dataEventSize == 0)
        return 0;

    int target;

    if (dataEventSize > 0)
        target = dataEventSize * 2;
    else
        target = 65536;

    int available = target - readBuffer.size();
    return available > 0 ? available : 0;
}

FileHandlePair::FileHandlePair() {
	/*Serial.printf("FileHandlePair constructor...\n");*/
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

void FileHandlePair::forceClose() {
	first->forceClose();
	second->forceClose();
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
	openEvent.emit(ev);

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
	        		p->getFirst()->dataEvent.off();
	        		p->getFirst()->drainEvent.off();
	        		p->getFirst()->closeEvent.off();
	        		p->getSecond()->dataEvent.off();
	        		p->getSecond()->drainEvent.off();
	        		p->getSecond()->closeEvent.off();
	        	}

	            return p->isClosed();
	        }
	    ),
	    pairs.end()
	);
}

void Fs::close() {
	//printf("closing fs...\n");
	tick();

	for (auto fp: pairs)
		fp->forceClose();

	for (int i=0; i<10; i++)
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
