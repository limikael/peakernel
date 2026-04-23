#include <stdio.h>

void test_fs_pair();
void test_fs_accept();
void test_fs_accept_read();
void test_InfoRecord();
void test_event_size();
void test_sys();
void test_encoding();

int main() {
	printf("Running tests...\n");

	test_fs_pair();
	test_fs_accept();
	test_fs_accept_read();
	test_InfoRecord();
	test_event_size();
	test_sys();
	test_encoding();

	return 0;
}