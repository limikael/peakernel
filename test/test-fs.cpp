#include <cstdio>
#include <Fs.h>
#include <cassert>
#include <deque>
#include <string>

std::string static vecToString(std::vector<uint8_t> vec) {
	std::string s(vec.begin(),vec.end());
	return s;
}

std::vector<uint8_t> static stringToVec(std::string s) {
	std::vector<unsigned char> v(s.begin(), s.end());
	return v;
}

void test_fs_pair() {
	printf("- fs pairs\n");
	auto fs=Fs::createForTesting();
	auto p=fs->createFileHandlePair();
	std::vector<uint8_t>received;

	p->getSecond()->dataEvent.on([&received](std::vector<uint8_t> data){
		received=data;
	});
	p->getFirst()->write(stringToVec("hello"));

	fs->tick();

	assert(vecToString(received)=="hello");

	fs->close();
	assert(fs->getNumOpenFiles()==0);
}

void test_fs_accept() {
	printf("- fs accept\n");
	auto fs=Fs::createForTesting();

	std::string received;

	fs->openEvent.on([&received](std::shared_ptr<OpenEvent> ev){
		auto myh=ev->accept();
		myh->dataEvent.on([&received](std::vector<uint8_t> data) {
			received=std::string(data.begin(),data.end());
			//printf("got data...\n");
		});
	});

	auto h=fs->open("/dev/console","w");
	h->write(stringToVec("hello"));

	fs->tick();

	assert(received=="hello");
}

void test_fs_accept_read() {
	printf("- fs accept read\n");
	auto fs=Fs::createForTesting();

	fs->openEvent.on([](std::shared_ptr<OpenEvent> ev){
		if (ev->getPathname()=="/f1") {
			auto f=ev->accept();
			f->write(stringToVec("hello1"));
		}

		if (ev->getPathname()=="/f2") {
			auto f=ev->accept();
			f->drainEvent.on([f]() {
				//printf("write...\n");
				f->write(stringToVec("hello2"));
				//printf("wrote...\n");
			});
		}
	});

	auto f1=fs->open("/f1","r");
	auto f2=fs->open("/f2","r");

	assert(fs->open("/somehing","r")==nullptr);

	std::string s1,s2;
	f1->dataEvent.on([&s1](std::vector<uint8_t> v) { s1+=vecToString(v); });
	f2->dataEvent.on([&s2](std::vector<uint8_t> v) { s2+=vecToString(v); });

	for (int i=0; i<10; i++)
		fs->tick();

	assert(s1=="hello1");
	//printf("%s\n",s2.c_str());
	assert(s2=="hello2hello2hello2hello2hello2hello2hello2hello2hello2");

	assert(fs->getNumOpenFiles()==2);
	f1->close();
	f2->close();
	fs->tick();

	assert(fs->getNumOpenFiles()==0);
}

void test_event_size() {
	printf("- fs can do buffered read\n");
	auto fs=Fs::createForTesting();

	fs->openEvent.on([](std::shared_ptr<OpenEvent> ev){
		if (ev->getPathname()=="/f1") {
			auto f=ev->accept();
			f->write(stringToVec("hello1"));
			f->close();
		}
	});

	std::vector<std::vector<uint8_t>> recv;

	bool gotClose=false;
	auto f1=fs->open("/f1","r");
	f1->closeEvent.on([&gotClose](){
		gotClose=true;
		//printf("close...\n");
	});
	f1->dataEvent.on([f1,&recv](std::vector<uint8_t> v) {
		std::string s=vecToString(v);
		recv.push_back(v);
	});

	f1->setDataEventSize(0);
	for (int i=0; i<10; i++)
		fs->tick();

	assert(recv.size()==0);
	assert(!gotClose);
	assert(f1->isClosing());
	assert(!f1->isClosed());

	f1->setDataEventSize(2);
	for (int i=0; i<10; i++)
		fs->tick();

	assert(recv.size()==3);
	assert(gotClose);
	assert(f1->isClosed());
}
