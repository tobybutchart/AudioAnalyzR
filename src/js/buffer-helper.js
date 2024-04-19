class BufferHelper {
    static asText(buffer, startPos, length) {
        const array = new Uint8Array(buffer, startPos, length);
        let ret = "";
        for(let i = 0; i < array.length; i++) {
            ret += String.fromCharCode(array[i]);
        }
        return ret;
    }

    static asInteger(buffer, startPos, length) {
        const array = new Uint8Array(buffer, startPos, length);
        return BufferHelper.byteArrayToInt(array);
    }

    static toHexString(buffer) {
        return Array.from(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }

    static byteArrayToInt(array) {
        let ret = 0;
        for (let i = array.length - 1; i >= 0; i--) {
            ret = (ret * 256) + array[i];
        }
        return ret;
    }

    static bitCountToByteCount(bitCount) {
        return bitCount / 8;
    }
}
