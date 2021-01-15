(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vaporyjs = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// base-x encoding
// Forked from https://github.com/cryptocoinjs/bs58
// Originally written by Mike Hearn for BitcoinJ
// Copyright (c) 2011 Google Inc
// Ported to JavaScript by Stefan Thomas
// Merged Buffer refactorings from base58-native by Stephen Pair
// Copyright (c) 2013 BitPay Inc

module.exports = function base (ALPHABET) {
  var ALPHABET_MAP = {}
  var BASE = ALPHABET.length
  var LEADER = ALPHABET.charAt(0)

  // pre-compute lookup table
  for (var i = 0; i < ALPHABET.length; i++) {
    ALPHABET_MAP[ALPHABET.charAt(i)] = i
  }

  function encode (source) {
    if (source.length === 0) return ''

    var digits = [0]
    for (var i = 0; i < source.length; ++i) {
      for (var j = 0, carry = source[i]; j < digits.length; ++j) {
        carry += digits[j] << 8
        digits[j] = carry % BASE
        carry = (carry / BASE) | 0
      }

      while (carry > 0) {
        digits.push(carry % BASE)
        carry = (carry / BASE) | 0
      }
    }

    var string = ''

    // deal with leading zeros
    for (var k = 0; source[k] === 0 && k < source.length - 1; ++k) string += ALPHABET[0]
    // convert digits to a string
    for (var q = digits.length - 1; q >= 0; --q) string += ALPHABET[digits[q]]

    return string
  }

  function decodeUnsafe (string) {
    if (string.length === 0) return []

    var bytes = [0]
    for (var i = 0; i < string.length; i++) {
      var value = ALPHABET_MAP[string[i]]
      if (value === undefined) return

      for (var j = 0, carry = value; j < bytes.length; ++j) {
        carry += bytes[j] * BASE
        bytes[j] = carry & 0xff
        carry >>= 8
      }

      while (carry > 0) {
        bytes.push(carry & 0xff)
        carry >>= 8
      }
    }

    // deal with leading zeros
    for (var k = 0; string[k] === LEADER && k < string.length - 1; ++k) {
      bytes.push(0)
    }

    return bytes.reverse()
  }

  function decode (string) {
    var array = decodeUnsafe(string)
    if (array) return array

    throw new Error('Non-base' + BASE + ' character')
  }

  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  }
}

},{}],2:[function(require,module,exports){
!function(globals) {
'use strict'

var convertHex = {
  bytesToHex: function(bytes) {
    /*if (typeof bytes.byteLength != 'undefined') {
      var newBytes = []

      if (typeof bytes.buffer != 'undefined')
        bytes = new DataView(bytes.buffer)
      else
        bytes = new DataView(bytes)

      for (var i = 0; i < bytes.byteLength; ++i) {
        newBytes.push(bytes.getUint8(i))
      }
      bytes = newBytes
    }*/
    return arrBytesToHex(bytes)
  },
  hexToBytes: function(hex) {
    if (hex.length % 2 === 1) throw new Error("hexToBytes can't have a string with an odd number of characters.")
    if (hex.indexOf('0x') === 0) hex = hex.slice(2)
    return hex.match(/../g).map(function(x) { return parseInt(x,16) })
  }
}


// PRIVATE

function arrBytesToHex(bytes) {
  return bytes.map(function(x) { return padLeft(x.toString(16),2) }).join('')
}

function padLeft(orig, len) {
  if (orig.length > len) return orig
  return Array(len - orig.length + 1).join('0') + orig
}


if (typeof module !== 'undefined' && module.exports) { //CommonJS
  module.exports = convertHex
} else {
  globals.convertHex = convertHex
}

}(this);
},{}],3:[function(require,module,exports){
var hex = require('convert-hex')

// For simplicity we redefine it, as the default uses lowercase
var BASE36_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
var bs36 = require('base-x')(BASE36_ALPHABET)

var ICAP = {}

ICAP.decodeBBAN = function (bban) {
  var length = bban.length
  if (length === 30 || length === 31) {
    var tmp = hex.bytesToHex(bs36.decode(bban))

    // FIXME: horrible padding code
    while (tmp.length < 40) {
      tmp = '0' + tmp
    }

    // NOTE: certain tools include an extra leading 0, drop that
    if ((tmp.length === 42) && (tmp[0] === '0') && (tmp[1] === '0')) {
      tmp = tmp.slice(2)
    }

    return '0x' + tmp
  } else if (length === 16) {
    return {
      asset: bban.slice(0, 3),
      institution: bban.slice(3, 7),
      client: bban.slice(7, 16)
    }
  } else {
    throw new Error('Not a valid Vapory BBAN')
  }
}

ICAP.encodeBBAN = function (bban) {
  if (typeof bban === 'object') {
    if (bban.asset.length !== 3 ||
        bban.institution.length !== 4 ||
        bban.client.length !== 9) {
      throw new Error('Invalid \'indirect\' Vapory BBAN')
    }
    return [ bban.asset, bban.institution, bban.client ].join('').toUpperCase()
  } else if ((bban.length === 42) && (bban[0] === '0') && (bban[1] === 'x')) {
    // Workaround for base-x, see https://github.com/cryptocoinjs/base-x/issues/18
    if ((bban[2] === '0') && (bban[3] === '0')) {
      bban = '0x' + bban.slice(4)
    }

    return bs36.encode(hex.hexToBytes(bban))
  } else {
    throw new Error('Not a valid input for Vapory BBAN')
  }
}

// ISO13616 reordering and letter translation
// NOTE: we assume input is uppercase only
// based off code from iban.js
function prepare (iban) {
  // move front to the back
  iban = iban.slice(4) + iban.slice(0, 4)

  // translate letters to numbers
  return iban.split('').map(function (n) {
    var code = n.charCodeAt(0)
    // 65 == A, 90 == Z in ASCII
    if (code >= 65 && code <= 90) {
      // A = 10, B = 11, ... Z = 35
      return code - 65 + 10
    } else {
      return n
    }
  }).join('')
}

// Calculate ISO7064 mod 97-10
// NOTE: assumes all numeric input string
function mod9710 (input) {
  var m = 0
  for (var i = 0; i < input.length; i++) {
    m *= 10
    m += input.charCodeAt(i) - 48 // parseInt()
    m %= 97
  }
  return m
}

ICAP.encode = function (bban, print) {
  bban = ICAP.encodeBBAN(bban)

  var checksum = 98 - mod9710(prepare('XE00' + bban))

  // format into 2 digits
  checksum = ('0' + checksum).slice(-2)

  var iban = 'XE' + checksum + bban
  if (print === true) {
    // split a group of 4 chars with spaces
    iban = iban.replace(/(.{4})/g, '$1 ')
  }

  return iban
}

ICAP.decode = function (iban, novalidity) {
  // change from 'print format' to 'electronic format', e.g. remove spaces
  iban = iban.replace(/\ /g, '')

  // check for validity
  if (!novalidity) {
    if (iban.slice(0, 2) !== 'XE') {
      throw new Error('Not in ICAP format')
    }

    if (mod9710(prepare(iban)) !== 1) {
      throw new Error('Invalid checksum in IBAN')
    }
  }

  return ICAP.decodeBBAN(iban.slice(4, 35))
}

/*
 * Convert Vapory address to ICAP
 * @method fromAddress
 * @param {String} address Address as a hex string.
 * @param {bool} nonstd Accept address which will result in non-standard IBAN
 * @returns {String}
 */
ICAP.fromAddress = function (address, print, nonstd) {
  var ret = ICAP.encode(address, print)

  if ((ret.replace(' ', '').length !== 34) && (nonstd !== true)) {
    throw new Error('Supplied address will result in invalid an IBAN')
  }

  return ret
}

/*
 * Convert asset into ICAP
 * @method fromAsset
 * @param {Object} asset Asset object, must contain the fields asset, institution and client
 * @returns {String}
 */
ICAP.fromAsset = function (asset, print) {
  return ICAP.encode(asset, print)
}

/*
 * Convert an ICAP into an address
 * @method toAddress
 * @param {String} iban IBAN/ICAP, must have an address encoded
 * @returns {String}
 */
ICAP.toAddress = function (iban) {
  var address = ICAP.decode(iban)
  if (typeof address !== 'string') {
    throw new Error('Not an address-encoded ICAP')
  }
  return address
}

/*
 * Convert an ICAP into an asset
 * @method toAsset
 * @param {String} iban IBAN/ICAP, must have an asset encoded
 * @returns {Object}
 */
ICAP.toAsset = function (iban) {
  var asset = ICAP.decode(iban)
  if (typeof asset !== 'object') {
    throw new Error('Not an asset-encoded ICAP')
  }
  return asset
}

ICAP.isICAP = function (iban) {
  try {
    ICAP.decode(iban)
    return true
  } catch (e) {
    return false
  }
}

ICAP.isAddress = function (iban) {
  try {
    ICAP.toAddress(iban)
    return true
  } catch (e) {
    return false
  }
}

ICAP.isAsset = function (iban) {
  try {
    ICAP.toAsset(iban)
    return true
  } catch (e) {
    return false
  }
}

module.exports = ICAP

},{"base-x":1,"convert-hex":2}],4:[function(require,module,exports){
'use strict';

module.exports = {
  ICAP: require('vaporyjs-icap')
};

},{"vaporyjs-icap":3}]},{},[4])(4)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZS14L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NvbnZlcnQtaGV4L2NvbnZlcnQtaGV4LmpzIiwibm9kZV9tb2R1bGVzL3ZhcG9yeWpzLWljYXAvaW5kZXguanMiLCJzcmMvdmFwb3J5anMtaWNhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdNQSxPQUFPLE9BQVAsR0FBaUI7QUFDZixRQUFNLFFBQVEsZUFBUjtBQURTLENBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gYmFzZS14IGVuY29kaW5nXG4vLyBGb3JrZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vY3J5cHRvY29pbmpzL2JzNThcbi8vIE9yaWdpbmFsbHkgd3JpdHRlbiBieSBNaWtlIEhlYXJuIGZvciBCaXRjb2luSlxuLy8gQ29weXJpZ2h0IChjKSAyMDExIEdvb2dsZSBJbmNcbi8vIFBvcnRlZCB0byBKYXZhU2NyaXB0IGJ5IFN0ZWZhbiBUaG9tYXNcbi8vIE1lcmdlZCBCdWZmZXIgcmVmYWN0b3JpbmdzIGZyb20gYmFzZTU4LW5hdGl2ZSBieSBTdGVwaGVuIFBhaXJcbi8vIENvcHlyaWdodCAoYykgMjAxMyBCaXRQYXkgSW5jXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZSAoQUxQSEFCRVQpIHtcbiAgdmFyIEFMUEhBQkVUX01BUCA9IHt9XG4gIHZhciBCQVNFID0gQUxQSEFCRVQubGVuZ3RoXG4gIHZhciBMRUFERVIgPSBBTFBIQUJFVC5jaGFyQXQoMClcblxuICAvLyBwcmUtY29tcHV0ZSBsb29rdXAgdGFibGVcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBBTFBIQUJFVC5sZW5ndGg7IGkrKykge1xuICAgIEFMUEhBQkVUX01BUFtBTFBIQUJFVC5jaGFyQXQoaSldID0gaVxuICB9XG5cbiAgZnVuY3Rpb24gZW5jb2RlIChzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG5cbiAgICB2YXIgZGlnaXRzID0gWzBdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2UubGVuZ3RoOyArK2kpIHtcbiAgICAgIGZvciAodmFyIGogPSAwLCBjYXJyeSA9IHNvdXJjZVtpXTsgaiA8IGRpZ2l0cy5sZW5ndGg7ICsraikge1xuICAgICAgICBjYXJyeSArPSBkaWdpdHNbal0gPDwgOFxuICAgICAgICBkaWdpdHNbal0gPSBjYXJyeSAlIEJBU0VcbiAgICAgICAgY2FycnkgPSAoY2FycnkgLyBCQVNFKSB8IDBcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKGNhcnJ5ID4gMCkge1xuICAgICAgICBkaWdpdHMucHVzaChjYXJyeSAlIEJBU0UpXG4gICAgICAgIGNhcnJ5ID0gKGNhcnJ5IC8gQkFTRSkgfCAwXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHN0cmluZyA9ICcnXG5cbiAgICAvLyBkZWFsIHdpdGggbGVhZGluZyB6ZXJvc1xuICAgIGZvciAodmFyIGsgPSAwOyBzb3VyY2Vba10gPT09IDAgJiYgayA8IHNvdXJjZS5sZW5ndGggLSAxOyArK2spIHN0cmluZyArPSBBTFBIQUJFVFswXVxuICAgIC8vIGNvbnZlcnQgZGlnaXRzIHRvIGEgc3RyaW5nXG4gICAgZm9yICh2YXIgcSA9IGRpZ2l0cy5sZW5ndGggLSAxOyBxID49IDA7IC0tcSkgc3RyaW5nICs9IEFMUEhBQkVUW2RpZ2l0c1txXV1cblxuICAgIHJldHVybiBzdHJpbmdcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZVVuc2FmZSAoc3RyaW5nKSB7XG4gICAgaWYgKHN0cmluZy5sZW5ndGggPT09IDApIHJldHVybiBbXVxuXG4gICAgdmFyIGJ5dGVzID0gWzBdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IEFMUEhBQkVUX01BUFtzdHJpbmdbaV1dXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuXG5cbiAgICAgIGZvciAodmFyIGogPSAwLCBjYXJyeSA9IHZhbHVlOyBqIDwgYnl0ZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgY2FycnkgKz0gYnl0ZXNbal0gKiBCQVNFXG4gICAgICAgIGJ5dGVzW2pdID0gY2FycnkgJiAweGZmXG4gICAgICAgIGNhcnJ5ID4+PSA4XG4gICAgICB9XG5cbiAgICAgIHdoaWxlIChjYXJyeSA+IDApIHtcbiAgICAgICAgYnl0ZXMucHVzaChjYXJyeSAmIDB4ZmYpXG4gICAgICAgIGNhcnJ5ID4+PSA4XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZGVhbCB3aXRoIGxlYWRpbmcgemVyb3NcbiAgICBmb3IgKHZhciBrID0gMDsgc3RyaW5nW2tdID09PSBMRUFERVIgJiYgayA8IHN0cmluZy5sZW5ndGggLSAxOyArK2spIHtcbiAgICAgIGJ5dGVzLnB1c2goMClcbiAgICB9XG5cbiAgICByZXR1cm4gYnl0ZXMucmV2ZXJzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBkZWNvZGUgKHN0cmluZykge1xuICAgIHZhciBhcnJheSA9IGRlY29kZVVuc2FmZShzdHJpbmcpXG4gICAgaWYgKGFycmF5KSByZXR1cm4gYXJyYXlcblxuICAgIHRocm93IG5ldyBFcnJvcignTm9uLWJhc2UnICsgQkFTRSArICcgY2hhcmFjdGVyJylcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZW5jb2RlOiBlbmNvZGUsXG4gICAgZGVjb2RlVW5zYWZlOiBkZWNvZGVVbnNhZmUsXG4gICAgZGVjb2RlOiBkZWNvZGVcbiAgfVxufVxuIiwiIWZ1bmN0aW9uKGdsb2JhbHMpIHtcbid1c2Ugc3RyaWN0J1xuXG52YXIgY29udmVydEhleCA9IHtcbiAgYnl0ZXNUb0hleDogZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAvKmlmICh0eXBlb2YgYnl0ZXMuYnl0ZUxlbmd0aCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIG5ld0J5dGVzID0gW11cblxuICAgICAgaWYgKHR5cGVvZiBieXRlcy5idWZmZXIgIT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgIGJ5dGVzID0gbmV3IERhdGFWaWV3KGJ5dGVzLmJ1ZmZlcilcbiAgICAgIGVsc2VcbiAgICAgICAgYnl0ZXMgPSBuZXcgRGF0YVZpZXcoYnl0ZXMpXG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMuYnl0ZUxlbmd0aDsgKytpKSB7XG4gICAgICAgIG5ld0J5dGVzLnB1c2goYnl0ZXMuZ2V0VWludDgoaSkpXG4gICAgICB9XG4gICAgICBieXRlcyA9IG5ld0J5dGVzXG4gICAgfSovXG4gICAgcmV0dXJuIGFyckJ5dGVzVG9IZXgoYnl0ZXMpXG4gIH0sXG4gIGhleFRvQnl0ZXM6IGZ1bmN0aW9uKGhleCkge1xuICAgIGlmIChoZXgubGVuZ3RoICUgMiA9PT0gMSkgdGhyb3cgbmV3IEVycm9yKFwiaGV4VG9CeXRlcyBjYW4ndCBoYXZlIGEgc3RyaW5nIHdpdGggYW4gb2RkIG51bWJlciBvZiBjaGFyYWN0ZXJzLlwiKVxuICAgIGlmIChoZXguaW5kZXhPZignMHgnKSA9PT0gMCkgaGV4ID0gaGV4LnNsaWNlKDIpXG4gICAgcmV0dXJuIGhleC5tYXRjaCgvLi4vZykubWFwKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHBhcnNlSW50KHgsMTYpIH0pXG4gIH1cbn1cblxuXG4vLyBQUklWQVRFXG5cbmZ1bmN0aW9uIGFyckJ5dGVzVG9IZXgoYnl0ZXMpIHtcbiAgcmV0dXJuIGJ5dGVzLm1hcChmdW5jdGlvbih4KSB7IHJldHVybiBwYWRMZWZ0KHgudG9TdHJpbmcoMTYpLDIpIH0pLmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIHBhZExlZnQob3JpZywgbGVuKSB7XG4gIGlmIChvcmlnLmxlbmd0aCA+IGxlbikgcmV0dXJuIG9yaWdcbiAgcmV0dXJuIEFycmF5KGxlbiAtIG9yaWcubGVuZ3RoICsgMSkuam9pbignMCcpICsgb3JpZ1xufVxuXG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvL0NvbW1vbkpTXG4gIG1vZHVsZS5leHBvcnRzID0gY29udmVydEhleFxufSBlbHNlIHtcbiAgZ2xvYmFscy5jb252ZXJ0SGV4ID0gY29udmVydEhleFxufVxuXG59KHRoaXMpOyIsInZhciBoZXggPSByZXF1aXJlKCdjb252ZXJ0LWhleCcpXG5cbi8vIEZvciBzaW1wbGljaXR5IHdlIHJlZGVmaW5lIGl0LCBhcyB0aGUgZGVmYXVsdCB1c2VzIGxvd2VyY2FzZVxudmFyIEJBU0UzNl9BTFBIQUJFVCA9ICcwMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonXG52YXIgYnMzNiA9IHJlcXVpcmUoJ2Jhc2UteCcpKEJBU0UzNl9BTFBIQUJFVClcblxudmFyIElDQVAgPSB7fVxuXG5JQ0FQLmRlY29kZUJCQU4gPSBmdW5jdGlvbiAoYmJhbikge1xuICB2YXIgbGVuZ3RoID0gYmJhbi5sZW5ndGhcbiAgaWYgKGxlbmd0aCA9PT0gMzAgfHwgbGVuZ3RoID09PSAzMSkge1xuICAgIHZhciB0bXAgPSBoZXguYnl0ZXNUb0hleChiczM2LmRlY29kZShiYmFuKSlcblxuICAgIC8vIEZJWE1FOiBob3JyaWJsZSBwYWRkaW5nIGNvZGVcbiAgICB3aGlsZSAodG1wLmxlbmd0aCA8IDQwKSB7XG4gICAgICB0bXAgPSAnMCcgKyB0bXBcbiAgICB9XG5cbiAgICAvLyBOT1RFOiBjZXJ0YWluIHRvb2xzIGluY2x1ZGUgYW4gZXh0cmEgbGVhZGluZyAwLCBkcm9wIHRoYXRcbiAgICBpZiAoKHRtcC5sZW5ndGggPT09IDQyKSAmJiAodG1wWzBdID09PSAnMCcpICYmICh0bXBbMV0gPT09ICcwJykpIHtcbiAgICAgIHRtcCA9IHRtcC5zbGljZSgyKVxuICAgIH1cblxuICAgIHJldHVybiAnMHgnICsgdG1wXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSAxNikge1xuICAgIHJldHVybiB7XG4gICAgICBhc3NldDogYmJhbi5zbGljZSgwLCAzKSxcbiAgICAgIGluc3RpdHV0aW9uOiBiYmFuLnNsaWNlKDMsIDcpLFxuICAgICAgY2xpZW50OiBiYmFuLnNsaWNlKDcsIDE2KVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIHZhbGlkIFZhcG9yeSBCQkFOJylcbiAgfVxufVxuXG5JQ0FQLmVuY29kZUJCQU4gPSBmdW5jdGlvbiAoYmJhbikge1xuICBpZiAodHlwZW9mIGJiYW4gPT09ICdvYmplY3QnKSB7XG4gICAgaWYgKGJiYW4uYXNzZXQubGVuZ3RoICE9PSAzIHx8XG4gICAgICAgIGJiYW4uaW5zdGl0dXRpb24ubGVuZ3RoICE9PSA0IHx8XG4gICAgICAgIGJiYW4uY2xpZW50Lmxlbmd0aCAhPT0gOSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFxcJ2luZGlyZWN0XFwnIFZhcG9yeSBCQkFOJylcbiAgICB9XG4gICAgcmV0dXJuIFsgYmJhbi5hc3NldCwgYmJhbi5pbnN0aXR1dGlvbiwgYmJhbi5jbGllbnQgXS5qb2luKCcnKS50b1VwcGVyQ2FzZSgpXG4gIH0gZWxzZSBpZiAoKGJiYW4ubGVuZ3RoID09PSA0MikgJiYgKGJiYW5bMF0gPT09ICcwJykgJiYgKGJiYW5bMV0gPT09ICd4JykpIHtcbiAgICAvLyBXb3JrYXJvdW5kIGZvciBiYXNlLXgsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vY3J5cHRvY29pbmpzL2Jhc2UteC9pc3N1ZXMvMThcbiAgICBpZiAoKGJiYW5bMl0gPT09ICcwJykgJiYgKGJiYW5bM10gPT09ICcwJykpIHtcbiAgICAgIGJiYW4gPSAnMHgnICsgYmJhbi5zbGljZSg0KVxuICAgIH1cblxuICAgIHJldHVybiBiczM2LmVuY29kZShoZXguaGV4VG9CeXRlcyhiYmFuKSlcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIHZhbGlkIGlucHV0IGZvciBWYXBvcnkgQkJBTicpXG4gIH1cbn1cblxuLy8gSVNPMTM2MTYgcmVvcmRlcmluZyBhbmQgbGV0dGVyIHRyYW5zbGF0aW9uXG4vLyBOT1RFOiB3ZSBhc3N1bWUgaW5wdXQgaXMgdXBwZXJjYXNlIG9ubHlcbi8vIGJhc2VkIG9mZiBjb2RlIGZyb20gaWJhbi5qc1xuZnVuY3Rpb24gcHJlcGFyZSAoaWJhbikge1xuICAvLyBtb3ZlIGZyb250IHRvIHRoZSBiYWNrXG4gIGliYW4gPSBpYmFuLnNsaWNlKDQpICsgaWJhbi5zbGljZSgwLCA0KVxuXG4gIC8vIHRyYW5zbGF0ZSBsZXR0ZXJzIHRvIG51bWJlcnNcbiAgcmV0dXJuIGliYW4uc3BsaXQoJycpLm1hcChmdW5jdGlvbiAobikge1xuICAgIHZhciBjb2RlID0gbi5jaGFyQ29kZUF0KDApXG4gICAgLy8gNjUgPT0gQSwgOTAgPT0gWiBpbiBBU0NJSVxuICAgIGlmIChjb2RlID49IDY1ICYmIGNvZGUgPD0gOTApIHtcbiAgICAgIC8vIEEgPSAxMCwgQiA9IDExLCAuLi4gWiA9IDM1XG4gICAgICByZXR1cm4gY29kZSAtIDY1ICsgMTBcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5cbiAgICB9XG4gIH0pLmpvaW4oJycpXG59XG5cbi8vIENhbGN1bGF0ZSBJU083MDY0IG1vZCA5Ny0xMFxuLy8gTk9URTogYXNzdW1lcyBhbGwgbnVtZXJpYyBpbnB1dCBzdHJpbmdcbmZ1bmN0aW9uIG1vZDk3MTAgKGlucHV0KSB7XG4gIHZhciBtID0gMFxuICBmb3IgKHZhciBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgbSAqPSAxMFxuICAgIG0gKz0gaW5wdXQuY2hhckNvZGVBdChpKSAtIDQ4IC8vIHBhcnNlSW50KClcbiAgICBtICU9IDk3XG4gIH1cbiAgcmV0dXJuIG1cbn1cblxuSUNBUC5lbmNvZGUgPSBmdW5jdGlvbiAoYmJhbiwgcHJpbnQpIHtcbiAgYmJhbiA9IElDQVAuZW5jb2RlQkJBTihiYmFuKVxuXG4gIHZhciBjaGVja3N1bSA9IDk4IC0gbW9kOTcxMChwcmVwYXJlKCdYRTAwJyArIGJiYW4pKVxuXG4gIC8vIGZvcm1hdCBpbnRvIDIgZGlnaXRzXG4gIGNoZWNrc3VtID0gKCcwJyArIGNoZWNrc3VtKS5zbGljZSgtMilcblxuICB2YXIgaWJhbiA9ICdYRScgKyBjaGVja3N1bSArIGJiYW5cbiAgaWYgKHByaW50ID09PSB0cnVlKSB7XG4gICAgLy8gc3BsaXQgYSBncm91cCBvZiA0IGNoYXJzIHdpdGggc3BhY2VzXG4gICAgaWJhbiA9IGliYW4ucmVwbGFjZSgvKC57NH0pL2csICckMSAnKVxuICB9XG5cbiAgcmV0dXJuIGliYW5cbn1cblxuSUNBUC5kZWNvZGUgPSBmdW5jdGlvbiAoaWJhbiwgbm92YWxpZGl0eSkge1xuICAvLyBjaGFuZ2UgZnJvbSAncHJpbnQgZm9ybWF0JyB0byAnZWxlY3Ryb25pYyBmb3JtYXQnLCBlLmcuIHJlbW92ZSBzcGFjZXNcbiAgaWJhbiA9IGliYW4ucmVwbGFjZSgvXFwgL2csICcnKVxuXG4gIC8vIGNoZWNrIGZvciB2YWxpZGl0eVxuICBpZiAoIW5vdmFsaWRpdHkpIHtcbiAgICBpZiAoaWJhbi5zbGljZSgwLCAyKSAhPT0gJ1hFJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW4gSUNBUCBmb3JtYXQnKVxuICAgIH1cblxuICAgIGlmIChtb2Q5NzEwKHByZXBhcmUoaWJhbikpICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2hlY2tzdW0gaW4gSUJBTicpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIElDQVAuZGVjb2RlQkJBTihpYmFuLnNsaWNlKDQsIDM1KSlcbn1cblxuLypcbiAqIENvbnZlcnQgVmFwb3J5IGFkZHJlc3MgdG8gSUNBUFxuICogQG1ldGhvZCBmcm9tQWRkcmVzc1xuICogQHBhcmFtIHtTdHJpbmd9IGFkZHJlc3MgQWRkcmVzcyBhcyBhIGhleCBzdHJpbmcuXG4gKiBAcGFyYW0ge2Jvb2x9IG5vbnN0ZCBBY2NlcHQgYWRkcmVzcyB3aGljaCB3aWxsIHJlc3VsdCBpbiBub24tc3RhbmRhcmQgSUJBTlxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuSUNBUC5mcm9tQWRkcmVzcyA9IGZ1bmN0aW9uIChhZGRyZXNzLCBwcmludCwgbm9uc3RkKSB7XG4gIHZhciByZXQgPSBJQ0FQLmVuY29kZShhZGRyZXNzLCBwcmludClcblxuICBpZiAoKHJldC5yZXBsYWNlKCcgJywgJycpLmxlbmd0aCAhPT0gMzQpICYmIChub25zdGQgIT09IHRydWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdTdXBwbGllZCBhZGRyZXNzIHdpbGwgcmVzdWx0IGluIGludmFsaWQgYW4gSUJBTicpXG4gIH1cblxuICByZXR1cm4gcmV0XG59XG5cbi8qXG4gKiBDb252ZXJ0IGFzc2V0IGludG8gSUNBUFxuICogQG1ldGhvZCBmcm9tQXNzZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBhc3NldCBBc3NldCBvYmplY3QsIG11c3QgY29udGFpbiB0aGUgZmllbGRzIGFzc2V0LCBpbnN0aXR1dGlvbiBhbmQgY2xpZW50XG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5JQ0FQLmZyb21Bc3NldCA9IGZ1bmN0aW9uIChhc3NldCwgcHJpbnQpIHtcbiAgcmV0dXJuIElDQVAuZW5jb2RlKGFzc2V0LCBwcmludClcbn1cblxuLypcbiAqIENvbnZlcnQgYW4gSUNBUCBpbnRvIGFuIGFkZHJlc3NcbiAqIEBtZXRob2QgdG9BZGRyZXNzXG4gKiBAcGFyYW0ge1N0cmluZ30gaWJhbiBJQkFOL0lDQVAsIG11c3QgaGF2ZSBhbiBhZGRyZXNzIGVuY29kZWRcbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbklDQVAudG9BZGRyZXNzID0gZnVuY3Rpb24gKGliYW4pIHtcbiAgdmFyIGFkZHJlc3MgPSBJQ0FQLmRlY29kZShpYmFuKVxuICBpZiAodHlwZW9mIGFkZHJlc3MgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYW4gYWRkcmVzcy1lbmNvZGVkIElDQVAnKVxuICB9XG4gIHJldHVybiBhZGRyZXNzXG59XG5cbi8qXG4gKiBDb252ZXJ0IGFuIElDQVAgaW50byBhbiBhc3NldFxuICogQG1ldGhvZCB0b0Fzc2V0XG4gKiBAcGFyYW0ge1N0cmluZ30gaWJhbiBJQkFOL0lDQVAsIG11c3QgaGF2ZSBhbiBhc3NldCBlbmNvZGVkXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICovXG5JQ0FQLnRvQXNzZXQgPSBmdW5jdGlvbiAoaWJhbikge1xuICB2YXIgYXNzZXQgPSBJQ0FQLmRlY29kZShpYmFuKVxuICBpZiAodHlwZW9mIGFzc2V0ICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBFcnJvcignTm90IGFuIGFzc2V0LWVuY29kZWQgSUNBUCcpXG4gIH1cbiAgcmV0dXJuIGFzc2V0XG59XG5cbklDQVAuaXNJQ0FQID0gZnVuY3Rpb24gKGliYW4pIHtcbiAgdHJ5IHtcbiAgICBJQ0FQLmRlY29kZShpYmFuKVxuICAgIHJldHVybiB0cnVlXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5JQ0FQLmlzQWRkcmVzcyA9IGZ1bmN0aW9uIChpYmFuKSB7XG4gIHRyeSB7XG4gICAgSUNBUC50b0FkZHJlc3MoaWJhbilcbiAgICByZXR1cm4gdHJ1ZVxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuSUNBUC5pc0Fzc2V0ID0gZnVuY3Rpb24gKGliYW4pIHtcbiAgdHJ5IHtcbiAgICBJQ0FQLnRvQXNzZXQoaWJhbilcbiAgICByZXR1cm4gdHJ1ZVxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJQ0FQXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgSUNBUDogcmVxdWlyZSgndmFwb3J5anMtaWNhcCcpXG59XG4iXX0=
