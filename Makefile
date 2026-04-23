.PHONY: test

test:
	rm -f test/*.out.*
	peabind -tquickjs js/firmware/bindings.json -otest/peac_bindings.out.cpp -ppeac_bindings_
	wrapcc -std=c++20 -o bin/testmain test/*.cpp src/encoding.cpp src/InfoRecord.cpp src/Fs.cpp -Isrc -Ivendor/quickjs $(shell peabind --lib-conf=cargs -tquickjs) -O0 -Iext/quickjs-2025-09-13 ext/quickjs-2025-09-13/libquickjs.a
	./bin/testmain
