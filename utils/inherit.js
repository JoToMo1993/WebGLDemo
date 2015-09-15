function inheritPseudoClass (Super, Sub) {
    var proto = Object.create(Super.prototype);
    Sub.prototype = proto;
    Sub.prototype.constructor = Sub;
}
