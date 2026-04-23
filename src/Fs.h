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
	FileHandle();
	~FileHandle() { /*Serial.printf("FileHandle destructor...\n");*/ }
	void write(std::vector<uint8_t> data);
	void tick();
	void close();
	bool isClosed() { return closed; }
	bool isClosing();
	void setOther(std::weak_ptr<FileHandle> other_) { other=other_; }
	void setDataEventSize(int v);
	int getDataWriteAdviceSize();
	Dispatcher<std::vector<uint8_t>> dataEvent;
	Dispatcher<> closeEvent;
	Dispatcher<> drainEvent;

private:
	int getIncomingCapacity();
	void handleIncoming(std::vector<uint8_t> data);
	bool closed=false;
	bool drainOnTick=false;
	std::weak_ptr<FileHandle> other;
	std::vector<uint8_t> readBuffer;
	int dataEventSize=-1;
};

class FileHandlePair {
public:
	FileHandlePair();
	std::shared_ptr<FileHandle> getFirst() { return first; }
	std::shared_ptr<FileHandle> getSecond() { return second; }
	void tick();
	void close();
	bool isClosed() { return (first->isClosed() && second->isClosed()); }

private:
	std::shared_ptr<FileHandle> first, second;
};

class OpenEvent {
public:
	OpenEvent(std::shared_ptr<FileHandlePair> pair_, std::string pathname_, std::string mode_);
	std::string getPathname() { return pathname; }
	std::string getMode() { return mode; }
	bool isAccepted() { return accepted; }
	std::shared_ptr<FileHandle> accept();

private:
	bool accepted=false;
	std::shared_ptr<FileHandlePair> pair;
	std::string pathname;
	std::string mode;
};

class Fs {
public:
	std::shared_ptr<FileHandlePair> createFileHandlePair();
	std::shared_ptr<FileHandle> open(std::string pathname, std::string mode);
	void tick();
	int getNumOpenFiles() { return pairs.size(); }
	void close();
	static std::shared_ptr<Fs> getInstance();
	static std::shared_ptr<Fs> createForTesting();
	Dispatcher<std::shared_ptr<OpenEvent>> openEvent;

private:
	Fs() {}
	std::vector<std::shared_ptr<FileHandlePair>> pairs;
};

std::shared_ptr<Fs> getFsInstance();
