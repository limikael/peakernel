#pragma once
#include <string>
#include "async_primitives.hpp"

class Response {
public:
	Promise<std::string> text();
	static std::shared_ptr<Response> fromText(std::string s);
	Response(std::string s) { responseText=s; }

private:
	std::string responseText;
};

Promise<std::shared_ptr<Response>> fetch(std::string url);