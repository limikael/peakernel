#include "peac_bindings.out.h"
#include <string>
#include "Fs.h"
#include <fstream>
#include <sstream>
#include <string>
#include <stdexcept>

std::string readFile(const std::string& path) {
    std::ifstream file(path, std::ios::binary);
    
    if (!file) {
        throw std::runtime_error("Failed to open file: " + path);
    }

    std::ostringstream ss;
    ss << file.rdbuf();

    return ss.str();
}

std::string evaljs(std::string code) {
    JSVAL res=jsvalEval(code.c_str());
    if (jsvalHasException()) {
        std::string m=jsvalCatchExceptionStdString();
        printf("Error: %s\n",m.c_str());
        abort();
    }
    char *tmp=jsvalGetStrdup(res);
    std::string s=std::string(tmp);
    free(tmp);
    jsvalFree(res);
    return s;
}

std::string static vecToString(std::vector<uint8_t> vec) {
	std::string s(vec.begin(),vec.end());
	return s;
}

std::vector<uint8_t> static stringToVec(std::string s) {
	std::vector<unsigned char> v(s.begin(), s.end());
	return v;
}

void test_sys() {
	printf("- testing that things are cleaned up...\n");
    jsvalQuickjsInit();
	peac_bindings_init_jsval();

	Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev){
		if (ev->getPathname()!="/testfile")
			return;

		auto f=ev->accept();
		f->write(stringToVec("hello world"));
	});

	Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev){
		if (ev->getPathname()!="/hello")
			return;

		auto f=ev->accept();
		if (!f)
			return;

		f->write(stringToVec("hello here is some data in this dynamically generated file"));
		f->close();
	});

	evaljs("globalThis.fs=getFsInstance()");
	evaljs(readFile("js/firmware/boot.js"));
	evaljs("globalThis.f=getFsInstance().open('/testfile','r');");
	evaljs("globalThis.g=getFsInstance().open('/hello','r');");
//	evaljs("globalThis.f.write(encodeAscii('test'))");
	std::string s=evaljs("globalThis.f");
	//printf("s: %s\n",s.c_str());

	Fs::getInstance()->tick();
	Fs::getInstance()->tick();
	Fs::getInstance()->tick();

	peac_bindings_exit();
	jsvalQuickjsExit();
}
