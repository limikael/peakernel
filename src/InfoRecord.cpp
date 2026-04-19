#include "InfoRecord.h"

static std::shared_ptr<InfoCollector> infoCollectorInstance;

std::string InfoRecord::getString(std::string key) {
	if (values.find(key)==values.end())
		return "";

	return values[key].s;
}

void InfoRecord::setString(std::string key, std::string value) {
	Value val;
	val.s=value;
	val.type="string";
	values[key]=val;
}

int InfoRecord::getInt(std::string key) {
	if (values.find(key)==values.end())
		return 0;

	return values[key].i;
}

void InfoRecord::setInt(std::string key, int value) {
	Value val;
	val.i=value;
	val.type="int";
	values[key]=val;
}

std::string InfoRecord::getType(std::string key) {
	if (values.find(key)==values.end())
		return "";

	return values[key].type;
}

std::shared_ptr<StringArray> InfoRecord::getKeys() {
	auto a=std::make_shared<StringArray>();

	for (const auto& [key, _]: values)
		a->push(key);

	return a;
}

std::shared_ptr<InfoCollector> getInfoCollector() {
	if (infoCollectorInstance==nullptr)
		infoCollectorInstance=std::make_shared<InfoCollector>();

	return infoCollectorInstance;
}

std::shared_ptr<InfoRecord> collectInfo() {
	auto infoRecord=std::make_shared<InfoRecord>();
	getInfoCollector()->collect.emit(infoRecord);
	return infoRecord;
}
