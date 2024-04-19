/* WAV errors start */
class BaseWAVError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        this.wav = null;
    }
}

class NullFileError extends BaseWAVError {}
class IncorrectFileTypeError extends BaseWAVError {}
class EmptyBufferError extends BaseWAVError {}
class UnknownChunkIDError extends BaseWAVError {}
class IncorrectChunkSizeError extends BaseWAVError {}
class UnknownFormatError extends BaseWAVError {}
class IncorrectByteRateError extends BaseWAVError {}
class IncorrectBlockAlignError extends BaseWAVError {}
/* WAV errors end */

class WAV {
    constructor(file, onAfterRead) {
        this.file = file;
        this.reader = new FileReader();
        this._onAfterRead = onAfterRead;

        this.reset();
    }

    reset() {
        this.buffer = null;

        this.name = (this.file && this.file.name) ? this.file.name : "";
        this.lastModified = (this.file && this.file.lastModified) ? this.file.lastModified : "";
        this.lastModifiedDate = (this.file && this.file.lastModifiedDate) ? this.file.lastModifiedDate : "";
        this.size = (this.file && this.file.size) ? this.file.size : 0;
        this.type = (this.file && this.file.type) ? this.file.type : "";

        /* header start */
        this.chunkID = "";
        this.chunkSize = 0;
        this.format = "";
        /* header end */

        /* fmt subchunk start */
        this.subchunk1ID = "";
        this.subchunk1Size = 0;
        this.audioFormat = "";
        this.numberOfChannels = 0;
        this.sampleRate = 0;
        this.byteRate = 0;
        this.blockAlign = 0;
        this.bitsPerSample = 0;
        this.extraParamSize = 0;
        this.extraParams = null;
        /* fmt subchunk end */

        /* data subchunk start */
        this.subchunk2StartPos = 0;
        this.subchunk2ID = "";
        this.subchunk2Size = 0;
        this.data = null;
        /* data subchunk end */

        this.milliseconds = 0;
        this.lastError = null;
    }

    /* callbacks start */
    onAfterRead() {
        if (typeof this._onAfterRead === 'function') {
            this._onAfterRead(this);
        }
    }
    /* callbacks end */

    /* error handling start */
    error(error) {
        error.wav = this;
        this.lastError = error;
        throw error;
    }

    onError(error) {
        this.error(error);
    }
    /* error handling end */

    /* FileReader load callbacks start */
    onLoad(reader) {
        this.buffer = reader.result;
    }

    onLoadEnd(reader) {
        /* header start */
        this.chunkID = BufferHelper.asText(this.buffer, 0, 4);
        if (this.chunkID !== "RIFF") {
            this.error(new UnknownChunkIDError(`Unknown chunk ID: ${this.chunkID}`));
        }

        this.chunkSize = BufferHelper.asInteger(this.buffer, 4, 4);
        if (this.chunkSize + 8 !== this.size) {
            this.error(new IncorrectChunkSizeError(`Incorrect chunk size: ${this.chunkSize}`));
        }

        this.format = BufferHelper.asText(this.buffer, 8, 4);
        if (this.format !== "WAVE") {
            this.error(new UnknownFormatError(`Unknown format: ${this.format}`));
        }
        /* header end */

        /* fmt subchunk start */
        this.subchunk1ID = BufferHelper.asText(this.buffer, 12, 4);
        if (this.subchunk1ID !== "fmt ") {
            this.error(new UnknownChunkIDError(`Unknown ID for subchunk 1: ${this.subchunk1ID}`));
        }

        this.subchunk1Size = BufferHelper.asInteger(this.buffer, 16, 4);
        if (this.subchunk1Size !== 16 && this.subchunk1Size !== 18) {
            this.error(new IncorrectChunkSizeError(`Incorrect subchunk 1 size: ${this.subchunk1Size}`));
        }

        this.audioFormat = BufferHelper.asInteger(this.buffer, 20, 2);
        this.numberOfChannels = BufferHelper.asInteger(this.buffer, 22, 2);
        this.sampleRate = BufferHelper.asInteger(this.buffer, 24, 4);
        this.byteRate = BufferHelper.asInteger(this.buffer, 28, 4);
        this.blockAlign = BufferHelper.asInteger(this.buffer, 32, 2);
        this.bitsPerSample = BufferHelper.asInteger(this.buffer, 34, 2);

        if (this.byteRate !== this.sampleRate * this.numberOfChannels * BufferHelper.bitCountToByteCount(this.bitsPerSample)) {
            this.error(new IncorrectByteRateError(`Incorrect byte rate: ${this.byteRate}`));
        }

        if (this.blockAlign !== this.numberOfChannels * BufferHelper.bitCountToByteCount(this.bitsPerSample)) {
            this.error(new IncorrectBlockAlignError(`Incorrect block align: ${this.blockAlign}`));
        }

        if (this.subchunk1Size > 16) {
            this.extraParamSize = BufferHelper.asInteger(this.buffer, 36, 2);

            if (this.extraParamSize > 0) {
                this.extraParams = BufferHelper.asInteger(this.buffer, 38, this.extraParamSize);
            }
        }
        /* fmt subchunk end */

        /* data subchunk start */
        this.subchunk2StartPos = 20 + this.subchunk1Size;

        this.subchunk2ID = BufferHelper.asText(this.buffer, this.subchunk2StartPos, 4);
        if (this.subchunk2ID !== "data") {
            this.error(new UnknownChunkIDError(`Unknown ID for subchunk 2: ${this.subchunk2ID}`));
        }

        this.subchunk2Size = BufferHelper.asInteger(this.buffer, this.subchunk2StartPos + 4, 4);
        /*if (this.subchunk2Size !== NumSamples * this.numberOfChannels * BufferHelper.bitCountToByteCount(this.bitsPerSample)) {
            this.error(new IncorrectChunkSizeError(`Incorrect subchunk 2 size: ${this.subchunk2Size}`));
        }*/
        if (this.subchunk2Size !== this.chunkSize - this.subchunk2StartPos) {
            this.error(new IncorrectChunkSizeError(`Incorrect subchunk 2 size: ${this.subchunk2Size}`));
        }

        this.data = this.buffer.slice(this.subchunk2StartPos + 8, this.subchunk2Size);
        /* data subchunk end */

        this.milliseconds = (((this.subchunk2Size / BufferHelper.bitCountToByteCount(this.bitsPerSample)) / this.sampleRate) / this.numberOfChannels) * 1000;

        this.onAfterRead();
    }
    /* FileReader load callbacks end */

    /* read WAV file data start */
    read() {
        this.reset();

        /* pre file load checks start */
        if (!this.file) {
            this.error(new NullFileError('Unknown file'));
        }

        if (this.type !== "audio/wav") {
            this.error(new IncorrectFileTypeError(`Unknown file type: ${this.type}`));
        }
        /* pre file load checks end */

        this.reader.onload = this.onLoad.bind(this, this.reader);
        this.reader.onloadend = this.onLoadEnd.bind(this, this.reader);
        this.reader.onerror = this.onError.bind(this);

        this.reader.readAsArrayBuffer(this.file);
        /*reader.readAsText(file);*/
    }
    /* read WAV file data end */
}
