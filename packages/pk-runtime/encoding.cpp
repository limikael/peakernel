#include <stdint.h>
#include <stddef.h>
#include <string>
#include <vector>
#include "encoding.h"

std::string decodeAscii(std::vector<uint8_t> vec) {
    std::string s(vec.begin(),vec.end());
    return s;
}

std::vector<uint8_t> encodeAscii(std::string s) {
    std::vector<unsigned char> v(s.begin(), s.end());
    return v;
}

std::string encodeBase64(std::vector<uint8_t> data) {
    std::string out;
    size_t size=data.size();
    out.resize(base64_get_encoded_size(size));
    base64_encode(data.data(),size,out.data());
    return out;
}

std::vector<uint8_t> decodeBase64(std::string s) {
    std::vector<uint8_t> out;
    size_t maxsize=base64_get_max_decoded_size(s.size());
    out.resize(maxsize);
    size_t actualsize=base64_decode(s.data(),s.size(),out.data());
    out.resize(actualsize);
    return out;
}


static inline int8_t b64_value(char c) {
    if (c >= 'A' && c <= 'Z') return c - 'A';
    if (c >= 'a' && c <= 'z') return c - 'a' + 26;
    if (c >= '0' && c <= '9') return c - '0' + 52;
    if (c == '+') return 62;
    if (c == '/') return 63;
    return -1;
}

size_t base64_decode(const char *in, size_t in_len, uint8_t *out) {
    size_t i;
    size_t j = 0;

    for (i = 0; i < in_len; i += 4)
    {
        int8_t a = b64_value(in[i]);
        int8_t b = b64_value(in[i+1]);
        int8_t c = (in[i+2] == '=') ? 0 : b64_value(in[i+2]);
        int8_t d = (in[i+3] == '=') ? 0 : b64_value(in[i+3]);

        uint32_t v = (a << 18) | (b << 12) | (c << 6) | d;

        out[j++] = (v >> 16) & 0xFF;

        if (in[i+2] != '=')
            out[j++] = (v >> 8) & 0xFF;

        if (in[i+3] != '=')
            out[j++] = v & 0xFF;
    }

    return j;
}

size_t base64_get_max_decoded_size(size_t input_length) {
    return (input_length / 4) * 3;
}

static const char b64_table[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

size_t base64_encode(const uint8_t *in, size_t in_len, char *out) {
    size_t i;
    size_t j = 0;

    for (i = 0; i < in_len; i += 3)
    {
        uint32_t v = 0;
        int remaining = in_len - i;

        v |= in[i] << 16;
        if (remaining > 1) v |= in[i+1] << 8;
        if (remaining > 2) v |= in[i+2];

        out[j++] = b64_table[(v >> 18) & 0x3F];
        out[j++] = b64_table[(v >> 12) & 0x3F];

        if (remaining > 1)
            out[j++] = b64_table[(v >> 6) & 0x3F];
        else
            out[j++] = '=';

        if (remaining > 2)
            out[j++] = b64_table[v & 0x3F];
        else
            out[j++] = '=';
    }

    return j;
}

size_t base64_get_encoded_size(size_t input_length) {
    return ((input_length + 2) / 3) * 4;
}