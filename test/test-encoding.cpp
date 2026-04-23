#include <cstdio>
#include <Fs.h>
#include <cassert>
#include <deque>
#include <string>
#include "peac_bindings.out.h"

static std::string evaljs(std::string code) {
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

void test_encoding() {
	printf("- testing encoding...\n");
    jsvalQuickjsInit();
	peac_bindings_init_jsval();

	std::string s=evaljs("globalThis.s=encodeBase64(encodeAscii('ABC')); globalThis.s");
	assert(s=="QUJD");
	//printf("enc: %s\n",s.c_str());
	std::string t=evaljs("decodeAscii(decodeBase64(globalThis.s))");
	assert(t=="ABC");
	//printf("dec: %s\n",t.c_str());


	peac_bindings_exit();
	jsvalQuickjsExit();
}
