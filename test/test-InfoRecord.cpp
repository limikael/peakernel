#include <cstdio>
#include <Fs.h>
#include <cassert>
#include "InfoRecord.h"
#include <format>
#include <iostream>

void test_InfoRecord() {
	printf("- info record\n");

	getInfoCollector()->collect.on([](std::shared_ptr<InfoRecord> info) {
		info->setString("hello","world");
		info->setInt("hello2",123);
	});

	std::shared_ptr<InfoRecord> info=collectInfo();
	assert(info->getString("hello")=="world");
	assert(info->getInt("hello2")==123);
	assert(info->getType("hello")=="string");
	assert(info->getType("hello2")=="int");

	auto keys=info->getKeys();
	assert(keys->size()==2);
	assert(keys->at(0)=="hello");
	assert(keys->at(1)=="hello2");
	assert(keys->at(2)=="");

	/*for (int i=0; i<keys->size(); i++) {
		std::cout << std::format("s={}\n",keys->at(i));
	}*/
}
