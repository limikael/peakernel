#pragma once
#include <peabind.h>
#include <memory>
#include <map>

class StringArray {
public:
	std::string at(int i) {
		if (i<0 || i>=items.size())
			return "";

		return items[i];
	}

	void push(std::string s) {
		items.push_back(s);
	}

	int size() {
		return items.size();
	}

private:
	std::vector<std::string> items;
};

class InfoRecord {
public:
	void setString(std::string key, std::string value);
	void setInt(std::string key, int value);
	std::string getString(std::string key);
	int getInt(std::string key);
	std::string getType(std::string key);
	std::shared_ptr<StringArray> getKeys();

private:
	class Value {
	public:
		std::string type;
		std::string s;
		int i;
	};

	std::map<std::string,Value> values;
};

class InfoCollector {
public:
	Dispatcher<std::shared_ptr<InfoRecord>> collectEvent;
	static std::shared_ptr<InfoCollector> getInstance();
	std::shared_ptr<InfoRecord> collectInfo();

private:
	InfoCollector() {}
};
