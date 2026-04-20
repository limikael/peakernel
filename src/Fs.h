#pragma once
#include <vector>
#include <memory>
#include "peabind.h"
#include <string>
#include <algorithm>
#include <cassert>

#ifdef ARDUINO
#include <Arduino.h>
#endif

class FileHandle {
public:
	~FileHandle() { /*Serial.printf("FileHandle destructor...\n");*/ }

	void write(std::vector<uint8_t> data) {
		assert(!isClosed());
		auto otherShared=other.lock();
		assert(otherShared!=nullptr);
		assert(!otherShared->isClosed());
		otherShared->handleIncoming(data);
	}

	void tick() {
		if (readBuffer.size()) {
			dataEvent.emit(readBuffer);
			readBuffer.clear();
		}
	}

	void close() {
		if (closed)
			return;

		closed=true;
		other.lock()->close();
	}

	bool isClosed() {
		return closed;
	}

	void setOther(std::weak_ptr<FileHandle> other_) { other=other_; }

	Dispatcher<std::vector<uint8_t>> dataEvent;
	Dispatcher<> closeEvent;

private:
	void handleIncoming(std::vector<uint8_t> data) {
		readBuffer.insert(readBuffer.end(), data.begin(), data.end());
	}

	bool closed=false;
	std::weak_ptr<FileHandle> other;
	std::vector<uint8_t> readBuffer;
};

class FileHandlePair {
public:
	FileHandlePair() {
		first=std::make_shared<FileHandle>();
		second=std::make_shared<FileHandle>();
		first->setOther(second);
		second->setOther(first);
	}

	std::shared_ptr<FileHandle> getFirst() { return first; }
	std::shared_ptr<FileHandle> getSecond() { return second; }

	void tick() {
		first->tick();
		second->tick();
	}

	void close() {
		first->close();
		second->close();
	}

	bool isClosed() {
		return (first->isClosed() || second->isClosed());
	}

private:
	std::shared_ptr<FileHandle> first, second;
};

class OpenEvent {
public:
	OpenEvent(std::shared_ptr<FileHandlePair> pair_, std::string pathname_, std::string mode_) {
		pair=pair_;
		pathname=pathname_;
		mode=mode_;
	}

	std::string getPathname() {
		return pathname;
	}

	bool isAccepted() {
		return accepted;
	}

	std::shared_ptr<FileHandle> accept() {
		if (accepted)
			return nullptr;

		accepted=true;
		return pair->getSecond();
	}

private:
	bool accepted=false;
	std::shared_ptr<FileHandlePair> pair;
	std::string pathname;
	std::string mode;
};

class Fs {
public:
	std::shared_ptr<FileHandlePair> createFileHandlePair() {
		std::shared_ptr<FileHandlePair> pair=std::make_shared<FileHandlePair>();
		pairs.push_back(pair);
		return pair;
	}

	std::shared_ptr<FileHandle> open(std::string pathname, std::string mode) {
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

	Dispatcher<std::shared_ptr<OpenEvent>> openRequest;

	void tick() {
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

	int getNumOpenFiles() {
		return pairs.size();
	}

	void close() {
		tick();

		for (auto fp: pairs)
			fp->close();

		tick();
	}

	static std::shared_ptr<Fs> getInstance();
	static std::shared_ptr<Fs> createForTesting();

private:
	Fs() {}
	std::vector<std::shared_ptr<FileHandlePair>> pairs;
};

std::shared_ptr<Fs> getFsInstance();
