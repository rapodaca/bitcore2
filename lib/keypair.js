var Privkey = require('./privkey');
var Pubkey = require('./pubkey');
var BN = require('./bn');
var point = require('./point');

var Key = function Key(obj) {
  if (!(this instanceof Key))
    return new Key(obj);
  if (obj)
    this.set(obj);
};

Key.prototype.set = function(obj) {
  this.privkey = obj.privkey || this.privkey || undefined;
  this.pubkey = obj.pubkey || this.pubkey || undefined;
  return this;
};

Key.prototype.fromPrivkey = function(privkey) {
  this.privkey = privkey;
  this.privkey2pubkey();
  return this;
};

Key.prototype.fromRandom = function() {
  this.privkey = Privkey().fromRandom();
  this.privkey2pubkey();
  return this;
};

Key.prototype.fromString = function(str) {
  var obj = JSON.parse(str);
  if (obj.privkey) {
    this.privkey = new Privkey();
    this.privkey.fromString(obj.privkey);
  }
  if (obj.pubkey) {
    this.pubkey = new Pubkey();
    this.pubkey.fromString(obj.pubkey);
  }
};

Key.prototype.privkey2pubkey = function() {
  this.pubkey = Pubkey().fromPrivkey(this.privkey);
};

Key.prototype.toString = function() {
  var obj = {};
  if (this.privkey)
    obj.privkey = this.privkey.toString();
  if (this.pubkey)
    obj.pubkey = this.pubkey.toString();
  return JSON.stringify(obj);
};

module.exports = Key;
