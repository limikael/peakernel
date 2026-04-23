#pragma once

std::string encodeBase64(std::vector<uint8_t> data);
std::vector<uint8_t> decodeBase64(std::string s);
std::string decodeAscii(std::vector<uint8_t> vec);
std::vector<uint8_t> encodeAscii(std::string s);

size_t base64_decode(const char *in, size_t in_len, uint8_t *out);
size_t base64_get_max_decoded_size(size_t input_length);
size_t base64_encode(const uint8_t *in, size_t in_len, char *out);
size_t base64_get_encoded_size(size_t input_length);
