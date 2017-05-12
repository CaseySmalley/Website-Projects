/*
	Copyright © 2017 Casey Smalley, All Rights Reserved
	Unauthorized use/modification of this file, via any medium is strictly prohibited
*/

(function(globalNamespace) {
	
	"use strict";
	
	// Private Logic
	
	// 2D split/compact
	// Insert 0 Between Each Bit
	const _8bit_split_2D = (b) => {
		b = b & 0b00001111;
		b = (b | b << 2) & 0b00110011;
		b = (b | b << 1) & 0b01010101;
		return b;
	}
	
	const _16bit_split_2D = (b) => {
		b = b & 0b0000000011111111;
		b = (b | b << 4) & 0b0000111100001111;
		b = (b | b << 2) & 0b0011001100110011;
		b = (b | b << 1) & 0b0101010101010101;
		return b;
	}
	
	const _32bit_split_2D = (b) => {
		b = b & 0b00000000000000001111111111111111;
		b = (b | b << 8) & 0b00000000111111110000000011111111;
		b = (b | b << 4) & 0b00001111000011110000111100001111;
		b = (b | b << 2) & 0b00110011001100110011001100110011;
		b = (b | b << 1) & 0b01010101010101010101010101010101;
		return b;
	}
	
	// Remove inserted 0
	const _8bit_compact_2D = (b) => {
		b = b & 0b01010101;
		b = (b | b >> 1) & 0b00110011;
		b = (b | b >> 2) & 0b00001111;
		return b;
	}
	
	const _16bit_compact_2D = (b) => {
		b = b & 0b0101010101010101;
		b = (b | b >> 1) & 0b0011001100110011;
		b = (b | b >> 2) & 0b0000111100001111;
		b = (b | b >> 4) & 0b0000000011111111;
		return b;
	}
	
	const _32bit_compact_2D = (b) => {
		b = b & 0b01010101010101010101010101010101;
		b = (b | b >> 1) & 0b00110011001100110011001100110011;
		b = (b | b >> 2) & 0b00001111000011110000111100001111;
		b = (b | b >> 4) & 0b00000000111111110000000011111111;
		b = (b | b >> 8) & 0b00000000000000001111111111111111;
		return b;
	}
	
	// 2D Encoding/Decoding
	
	const _8bitEncode_2D = (x,y) => _8bit_split_2D(x) | _8bit_split_2D(y) << 1;
	const _16bitEncode_2D = (x,y) => _16bit_split_2D(x) | _16bit_split_2D(y) << 1;
	const _32bitEncode_2D = (x,y) => _32bit_split_2D(x) | _32bit_split_2D(y) << 1;
	
	const _8bitDecode_2D = (z) => [_8bit_compact_2D(z),_8bit_compact_2D(z >> 1)];
	const _16bitDecode_2D = (z) => [_16bit_compact_2D(z),_16bit_compact_2D(z >> 1)];
	const _32bitDecode_2D = (z) => [_32bit_compact_2D(z),_32bit_compact_2D(z >> 1)];
	
	// 3D Split/Compact
	// Insert 00 Between bits
	
	// 4 bit coordinates
	const _16bit_split_3D = (b) => {
		b = b & 0b0000000000001111;
		b = (b | b << 4) & 0b0000000011000011;
		b = (b | b << 2) & 0b0000001001001001;
		return b;
	}
	
	const _32bit_split_3D = (b) => {
		b = b & 0b00000000000000000000001111111111;
		b = (b | b << 16) & 0b11000000000000000011111111;
		b = (b | b <<  8) & 0b11000000001111000000001111;
		b = (b | b <<  4) & 0b11000011000011000011000011;
		b = (b | b <<  2) & 0b1001001001001001001001001001;
		return b;
	}
	
	// Remove Inserted 00
	const _16bit_compact_3D = (b) => {
		b = b & 0b0000001001001001;
		b = (b | b >> 2) & 0b0000000011000011;
		b = (b | b >> 4) & 0b0000000000001111;
		return b;
	}
	
	const _32bit_compact_3D = (b) => {
		b = b & 0b1001001001001001001001001001;
		b = (b | b >>  2) & 0b11000011000011000011000011;
		b = (b | b >>  4) & 0b11000000001111000000001111;
		b = (b | b >>  8) & 0b11000000000000000011111111;
		b = (b | b >> 16) & 0b00000000000000000000001111111111;
		return b;
	}
	
	// 3D Encoding/Decoding
	
	const _16bitEncode_3D = (x,y,z) => _16bit_split_3D(x) | _16bit_split_3D(y) << 1 | _16bit_split_3D(z) << 2; // Interleave seperated bits
	const _32bitEncode_3D = (x,y,z) => _32bit_split_3D(x) | _32bit_split_3D(y) << 1 | _32bit_split_3D(z) << 2;
	
	// Javascript bitwise operators use 32 bit integers
	// For any morton number larger then this, multiple variables are required
	const _48bitEncode_3D = (x,y,z) => {
		let h = 0; // h & l contain the bits that would be stored in a 48 bit morton number
		let l = 0; // (in big endian order)
		
		let h_x = (x & 0b00000000000000001111100000000000) >> 10;
		let h_y = (y & 0b00000000000000001111100000000000) >> 9;
		let h_z = (z & 0b00000000000000001111110000000000) >> 10;
		
		let l_x = (x & 0b00000000000000001111111111111111);
		let l_y = (y & 0b00000000000000001111111111111111) << 1;
		let l_z = (z & 0b00000000000000001111111111111111) << 2;
		
		h_x = (h_x | h_x <<  4) & 0b0000001100001110;
		h_x = (h_x | h_x <<  2) & 0b0000110000110010;
		h_x = (h_x | h_x <<  2) & 0b0010010010010010;
		
		h_y = (h_y | h_y <<  4) & 0b0000011000011100;
		h_y = (h_y | h_y <<  2) & 0b0001100001100100;
		h_y = (h_y | h_y <<  2) & 0b0100100100100100;
		
		h_z = (h_z | h_z <<  2) & 0b0000000011111001;
		h_z = (h_z | h_z <<  2) & 0b0000001111001001;
		h_z = (h_z | h_z <<  4) & 0b0011000011001001;
		h_z = (h_z | h_z <<  2) & 0b1001001001001001;
		
		l_x = (l_x | l_x << 16) & 0b11111111000000000000000011111111;
		l_x = (l_x | l_x <<  8) & 0b00001111000000001111000000001111;
		l_x = (l_x | l_x <<  4) & 0b11000011000011000011000011000011;
		l_x = (l_x | l_x <<  2) & 0b01001001001001001001001001001001;
		
		l_y = (l_y | l_y << 16) & 0b11111110000000000000000111111110;
		l_y = (l_y | l_y <<  8) & 0b00011110000000011110000000011110;
		l_y = (l_y | l_y <<  4) & 0b10000110000110000110000110000110;
		l_y = (l_y | l_y <<  2) & 0b10010010010010010010010010010010;
		
		l_z = (l_z | l_z << 16) & 0b11111100000000000000001111111100;
		l_z = (l_z | l_z <<  8) & 0b00111100000000111100000000111100;
		l_z = (l_z | l_z <<  4) & 0b00001100001100001100001100001100;
		l_z = (l_z | l_z <<  2) & 0b00100100100100100100100100100100;
		
		h = (h_x | h_y | h_z) >>> 0; // triple right shift ensures an unsigned 32 bit integer,
		l = (l_x | l_y | l_z) >>> 0; // since normal binary operands are signed with two's compliment
		return [h,l];
	}
	
	const _16bitDecode_3D = (z) => [_16bit_compact_3D(z),_16bit_compact_3D(z >> 1),_16bit_compact_3D(z >> 2)]; // Deleave bits
	const _32bitDecode_3D = (z) => [_32bit_compact_3D(z),_32bit_compact_3D(z >> 1),_32bit_compact_3D(z >> 2)];
	
	// Decoding is simply the reverse operation of the encoding process
	const _48bitDecode_3D = (h,l) => {
		let x = 0;
		let y = 0;
		let z = 0;
		
		let h_x = h & 0b0010010010010010;
		let h_y = h & 0b0100100100100100;
		let h_z = h & 0b1001001001001001;
		
		let l_x = l & 0b01001001001001001001001001001001;
		let l_y = l & 0b10010010010010010010010010010010;
		let l_z = l & 0b00100100100100100100100100100100;
		
		h_x = (h_x | h_x >> 2) & 0b0000110000110010;
		h_x = (h_x | h_x >> 2) & 0b0000001100001110;
		h_x = (h_x | h_x >> 4) & 0b0000000000111110;
		
		h_y = (h_y | h_y >> 2) & 0b0001100001100100;
		h_y = (h_y | h_y >> 2) & 0b0000011000011100;
		h_y = (h_y | h_y >> 4) & 0b0000000001111100;
		
		h_z = (h_z | h_z >> 2) & 0b0011000011001001;
		h_z = (h_z | h_z >> 4) & 0b0000001111001001;
		h_z = (h_z | h_z >> 2) & 0b0000000011111001;
		h_z = (h_z | h_z >> 2) & 0b0000000000111111;
		
		l_x = (l_x | l_x >>  2) & 0b11000011000011000011000011000011;
		l_x = (l_x | l_x >>  4) & 0b00001111000000001111000000001111;
		l_x = (l_x | l_x >>  8) & 0b11111111000000000000000011111111;
		l_x = (l_x | l_x >> 16) & 0b00000000000000001111111111111111;
		
		l_y = (l_y | l_y >>  2) & 0b10000110000110000110000110000110;
		l_y = (l_y | l_y >>  4) & 0b00011110000000011110000000011110;
		l_y = (l_y | l_y >>  8) & 0b11111110000000000000000111111110;
		l_y = (l_y | l_y >> 16) & 0b00000000000000011111111111111110;
		
		l_z = (l_z | l_z >>  2) & 0b00001100001100001100001100001100;
		l_z = (l_z | l_z >>  4) & 0b00111100000000111100000000111100;
		l_z = (l_z | l_z >>  8) & 0b11111100000000000000001111111100;
		l_z = (l_z | l_z >> 16) & 0b00000000000000111111111111111100;
		
		x = (h_x << 10) |  l_x;
		y = (h_y <<  9) | (l_y >> 1);
		z = (h_z << 10) | (l_z >> 2);
		
		return [x,y,z];
	}
	
	// Split into bytes (Big Endian)
	const _16bitToBytes = (m) => {
		let bytes = [];
		bytes.length = 2;
		bytes[0] = (m & 0b1111111100000000) >> 8;
		bytes[1] = (m & 0b0000000011111111);
		return bytes
	}
	
	const _32bitToBytes = (m) => {
		let bytes = [];
		bytes.length = 4;
		bytes[0] = (m & 0b11111111000000000000000000000000) >> 24;
		bytes[1] = (m & 0b00000000111111110000000000000000) >> 16;
		bytes[2] = (m & 0b00000000000000001111111100000000) >> 8;
		bytes[3] = (m & 0b00000000000000000000000011111111);
	}
	
	const _48bitToBytes = (m) => {
		let bytes = [];
		bytes.length = 6;
	}
	
	// Public Interface
	let publicInterface = {};
	
	publicInterface._8_BIT_2D = 0;
	publicInterface._16_BIT_2D = 1;
	publicInterface._32_BIT_2D = 3;
	
	publicInterface._16_BIT_3D = 4;
	publicInterface._32_BIT_3D = 5;
	publicInterface._48_BIT_3D = 6;
	publicInterface._64_BIT_3D = 7;
	
	publicInterface.encode = (type,x,y,z) => {
		switch(type) {
			case publicInterface._8_BIT_2D: return _8bitEncode_2D(x,y); break;
			case publicInterface._16_BIT_2D: return _16bitEncode_2D(x,y); break;
			case publicInterface._32_BIT_2D: return _32bitEncode_2D(x,y); break;
			
			case publicInterface._16_BIT_3D: return _16bitEncode_3D(x,y,z); break;
			case publicInterface._32_BIT_3D: return _32bitEncode_3D(x,y,z); break;
			case publicInterface._48_BIT_3D: return _48bitEncode_3D(x,y,z); break;
		}
	}
	
	publicInterface.decode = (type,h,l) => {
		switch(type) {
			case publicInterface._8_BIT_2D: return _8bitDecode_2D(h); break;
			case publicInterface._16_BIT_2D: return _16bitDecode_2D(h); break;
			case publicInterface._32_BIT_2D: return _32bitDecode_2D(h); break;
			
			case publicInterface._16_BIT_3D: return _16bitDecode_3D(h); break;
			case publicInterface._32_BIT_3D: return _32bitDecode_3D(h); break;
			case publicInterface._48_BIT_3D: return _48bitDecode_3D(h,l); break;
		}
	}
	
	globalNamespace.mortonNumber = publicInterface;
	
	globalNamespace.resource.printNotice("MortonNumber.js © Casey Smalley 2017");
	
}(program));