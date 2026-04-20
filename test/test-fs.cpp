#define PRIVATE_FS_CONSTRUCTOR_FOR_TESTING
#include <cstdio>
#include <Fs.h>
#include <cassert>

std::string vecToString(std::vector<uint8_t> vec) {
	std::string s(vec.begin(),vec.end());
	return s;
}

std::vector<uint8_t> stringToVec(std::string s) {
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

	fs->openRequest.on([&received](std::shared_ptr<OpenEvent> ev){
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

	fs->openRequest.on([](std::shared_ptr<OpenEvent> ev){
		if (ev->getPathname()=="/f1") {
			auto f=ev->accept();
			f->write(stringToVec("hello1"));
		}

		if (ev->getPathname()=="/f2") {
			auto f=ev->accept();
			f->write(stringToVec("hello2"));
		}
	});

	auto f1=fs->open("/f1","r");
	auto f2=fs->open("/f2","r");

	assert(fs->open("/somehing","r")==nullptr);

	std::string s1,s2;
	f1->dataEvent.on([&s1](std::vector<uint8_t> v) { s1=vecToString(v); });
	f2->dataEvent.on([&s2](std::vector<uint8_t> v) { s2=vecToString(v); });

	fs->tick();

	assert(s1=="hello1");
	assert(s2=="hello2");

	assert(fs->getNumOpenFiles()==2);
	f1->close();
	f2->close();
	fs->tick();

	assert(fs->getNumOpenFiles()==0);
}
