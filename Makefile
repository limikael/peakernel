.PHONY: test

test:
	rm -f test/*.out.*
	peabind -tquickjs packages/pk-vfs/bindings.json packages/pk-runtime/bindings.json -otest/pk_bindings.out.cpp -ppk_bindings_
	wrapcc -std=c++20 \
		-o bin/testmain \
		test/*.cpp \
		packages/pk-runtime/encoding.cpp \
		packages/pk-runtime/Timer.cpp \
		packages/pk-info/InfoRecord.cpp \
		packages/pk-vfs/Fs.cpp \
		-Ipackages/pk-vfs \
		-Ipackages/pk-info \
		-Ipackages/pk-runtime \
		-Ivendor/quickjs \
		$(shell peabind --lib-conf=cargs -tquickjs) \
		-O0 \
		-Iext/quickjs-2025-09-13 \
		ext/quickjs-2025-09-13/libquickjs.a
	./bin/testmain
