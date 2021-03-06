var BufferReader = require('./bufferreader');
var BufferWriter = require('./bufferwriter');
var Opcode = require('./opcode');

var Script = function Script(buf) {
  if (!(this instanceof Script))
    return new Script(buf);
  
  this.chunks = [];

  if (Buffer.isBuffer(buf)) {
    this.fromBuffer(buf);
  }
  else if (typeof buf === 'string') {
    var str = buf;
    this.fromString(str);
  }
  else if (typeof buf !== 'undefined') {
    var obj = buf;
    this.set(obj);
  }
};

Script.prototype.set = function(obj) {
  this.chunks = obj.chunks || this.chunks;
  return this;
};

Script.prototype.fromJSON = function(json) {
  return this.fromString(json);
};

Script.prototype.toJSON = function() {
  return this.toString();
};

Script.prototype.fromBuffer = function(buf) {
  this.chunks = [];

  var br = new BufferReader(buf);
  while (!br.eof()) {
    var opcodenum = br.readUInt8();

    var len, buf;
    if (opcodenum > 0 && opcodenum < Opcode.map.OP_PUSHDATA1) {
      len = opcodenum;
      this.chunks.push({
        buf: br.read(len),
        len: len,
        opcodenum: opcodenum
      });
    } else if (opcodenum === Opcode.map.OP_PUSHDATA1) {
      len = br.readUInt8();
      var buf = br.read(len);
      this.chunks.push({
        buf: buf,
        len: len,
        opcodenum: opcodenum
      });
    } else if (opcodenum === Opcode.map.OP_PUSHDATA2) {
      len = br.readUInt16LE();
      buf = br.read(len);
      this.chunks.push({
        buf: buf,
        len: len,
        opcodenum: opcodenum
      });
    } else if (opcodenum === Opcode.map.OP_PUSHDATA4) {
      len = br.readUInt32LE();
      buf = br.read(len);
      this.chunks.push({
        buf: buf,
        len: len,
        opcodenum: opcodenum
      });
    } else {
      this.chunks.push(opcodenum);
    }
  }

  return this;
};

Script.prototype.toBuffer = function() {
  var bw = new BufferWriter();

  for (var i = 0; i < this.chunks.length; i++) {
    var chunk = this.chunks[i];
    if (typeof chunk === 'number') {
      var opcodenum = chunk;
      bw.writeUInt8(opcodenum);
    } else {
      var opcodenum = chunk.opcodenum;
      bw.writeUInt8(chunk.opcodenum);
      if (opcodenum < Opcode.map.OP_PUSHDATA1) {
        bw.write(chunk.buf);
      }
      else if (opcodenum === Opcode.map.OP_PUSHDATA1) {
        bw.writeUInt8(chunk.len);
        bw.write(chunk.buf);
      }
      else if (opcodenum === Opcode.map.OP_PUSHDATA2) {
        bw.writeUInt16LE(chunk.len);
        bw.write(chunk.buf);
      }
      else if (opcodenum === Opcode.map.OP_PUSHDATA4) {
        bw.writeUInt32LE(chunk.len);
        bw.write(chunk.buf);
      }
    }
  }

  return bw.concat();
};

Script.prototype.fromString = function(str) {
  this.chunks = [];

  var tokens = str.split(' ');
  var i = 0;
  while (i < tokens.length) {
    var token = tokens[i];
    var opcode = Opcode(token);
    var opcodenum = opcode.toNumber();

    if (typeof opcodenum === 'undefined') {
      opcodenum = parseInt(token);
      if (opcodenum > 0 && opcodenum < Opcode.map.OP_PUSHDATA1) {
        this.chunks.push({
          buf: new Buffer(tokens[i + 1].slice(2), 'hex'),
          len: opcodenum,
          opcodenum: opcodenum
        });
        i = i + 2;
      }
      else {
        throw new Error('Invalid script');
      }
    } else if (opcodenum === Opcode.map.OP_PUSHDATA1 || opcodenum === Opcode.map.OP_PUSHDATA2 || opcodenum === Opcode.map.OP_PUSHDATA4) {
      this.chunks.push({
        buf: new Buffer(tokens[i + 2].slice(2), 'hex'),
        len: parseInt(tokens[i + 1]),
        opcodenum: opcodenum
      });
      i = i + 3;
    } else {
      this.chunks.push(opcodenum);
      i = i + 1;
    }
  }
  return this;
};

Script.prototype.toString = function() {
  var str = "";

  for (var i = 0; i < this.chunks.length; i++) {
    var chunk = this.chunks[i];
    if (typeof chunk === 'number') {
      var opcodenum = chunk;
      str = str + Opcode(opcodenum).toString() + " ";
    } else {
      var opcodenum = chunk.opcodenum;
      if (opcodenum === Opcode.map.OP_PUSHDATA1 || opcodenum === Opcode.map.OP_PUSHDATA2 || opcodenum === Opcode.map.OP_PUSHDATA4)
        str = str + Opcode(opcodenum).toString() + " " ;
      str = str + chunk.len + " " ;
      str = str + "0x" + chunk.buf.toString('hex') + " ";
    }
  }

  return str.substr(0, str.length - 1);
};

module.exports = Script;
