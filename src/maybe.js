const R = require('ramda')
const map = R.map

const Maybe = function (x) {
    this.__value = x;
}

Maybe.of = function (x) {
    return new Maybe(x);
}

Maybe.prototype.isNothing = function () {
    return (this.__value === null || this.__value === undefined);
}

Maybe.prototype.map = function (f) {
    console.log("exec: map", f, this.__value)
    return this.isNothing() ? Maybe.of(null) : Maybe.of(f(this.__value))
}

const safeProp = R.curry(function (x, obj) {
    console.log("exec: safeProp", x, obj)
    return new Maybe(obj[x])
})

const safeHead = safeProp(0)

const firstAddressStreet = R.compose(R.map(R.map(safeProp('street'))), R.map(safeHead), safeProp('addresses'))

console.log("do: firstAddressStreet")
let result = firstAddressStreet({addresses: [{street: {name: 'sea', number: 8402}, postcode: "WC2N"}]});
console.log("done: firstAddressStreet")

console.log(result)
console.log(result.__value)
console.log(result.__value.__value)
console.log(result.__value.__value.__value)

// Maybe 层次叠加是在 map 函数中叠加的，执行的函数会返回一个函子，而 map 函数又自己封装了个函子，导致两层函子被返回。

Maybe.prototype.join = function () {
    console.log("[exec: join]", this.__value)
    return this.isNothing() ? Maybe.of(null) : this.__value
}

const join = function (mma) {
    return mma.join()
}

const firstAddressStreet_v2 = R.compose(
    join, map(safeProp('street')), join, map(safeHead), safeProp('addresses')
)

console.log("do: firstAddressStreet_v2")
result = firstAddressStreet_v2({addresses: [{street: {name: 'sea', number: 8402}, postcode: "WC2N"}]});
console.log("done: firstAddressStreet_v2")

console.log(result.__value)

const chain = R.curry(function (f, m) {
    return m.map(f).join();
})

const firstAddressStreet_v3 = R.compose(
    chain(safeProp('street')), chain(safeHead), safeProp('addresses')
);