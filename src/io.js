const R = require('ramda')
let fs = require('fs');


const IO = function (f) {
    this.unsafePerformIO = f;
}

IO.of = function (x) {
    return new IO(function () {
        return x
    })
}

IO.prototype.map = function (f) {
    console.log("exec: io map", f)
    return new IO(R.compose(f, this.unsafePerformIO))
}

// readFile :: String -> IO String
const readFile = function (filename) {
    console.log("exec: readFile")
    const unsafeFuncA = function () {
        console.log("exec: unsafeFuncA")
        return fs.readFileSync(filename, 'utf-8')
    }
    return new IO(unsafeFuncA)
}

// print :: String -> IO String
const print = function (x) {
    console.log("exec: print")
    const unsafeFuncB = function () {
        console.log("exec: unsafeFuncB")
        console.log(x);
        return x;
    }
    return new IO(unsafeFuncB)
}

const cat = R.compose(R.map(print), readFile)

// console.log("do: cat")
// let result = cat('index.ts');
//
// // 由于最终执行的函数 print 会返回一个 IO
// console.log("do: perform")
// let io2 = result.unsafePerformIO();
// console.log("do: perform io2")
// io2.unsafePerformIO()

// 让我们来看看上述代码执行过程中发生了什么
// R.compose 将 readFile 函数与 print 函数组合了起来，因为 readFile 函数执行时会返回 IO 函子，所以要使用 R.map 将 print 函数包含起来
// R.map 会返回一个包裹，外包装会执行函子的 map，闭包参数为 R.map 的参数，即 print
// cat('index.ts') 会导致被组合的函数执行
// 实际执行顺序为 readFile -> map
// 首先执行 readFile，返回了一个包含 funcA 函数的函子
// 再通过 map 将 funcA 函数与 print 函数组合
// 此时注意，map 函数会返回一个由 IO 函子包裹的组合函数，而被组合的 funcA 与 print 中， print 函数也会返回一个由 IO 函子包裹的 funcB
// 这意味着，当我们执行这个 IO 函子的内容时，会先执行组合函数，即执行 funcA 后再执行 print。
// 执行完 print 后会返回一个 IO funcB。
// 要完整执行这个组合函数，需要再执行一遍返回的 IO 函子内容。
// 所以， result.unsafePerformIO() 对应的执行顺序为 funcA -> print (此时产生一个新的 IO 函子)
// 再执行一遍 unsafePerformIO() 对应的执行函数为 funcB

const head = function (x) {
    console.log("exec: head")
    return x[0]
}

const catFirstChar = R.compose(R.map(R.map(head)), cat)
// console.log("do: catFirstChar")
// result = catFirstChar('index.ts');
//
// console.log("do: perform")
// io2 = result.unsafePerformIO();
// console.log("do: perform io2")
// let io3 = io2.unsafePerformIO();
// console.log("io3: " + io3)

const join = function (mma) {
    return mma.join()
}

IO.prototype.join = function () {
    console.log("[exec: join]", this.unsafePerformIO)
    return this.unsafePerformIO();
}

const cat_v2 = R.compose(join, R.map(print), readFile)
const catFirstChar_v2 = R.compose(join, R.map(head), cat_v2)

console.log("[do: catFirstChar_v2]")
result = catFirstChar_v2('index.ts');
console.log("[done: catFirstChar_v2]")
console.log("result", result)

// 通过 join 函数，我们不再需要执行 unsafePerformIO，用户执行函数就需要承担责任，但不用再痛苦地剥洋葱了。
// 实现了 join 的 pointed functor，就是 monad，至此，IO Functor 已经是 IO Monad 了。

const chain = R.curry(function (f, m) {
    return m.map(f).join();
})

const cat_v3 = R.compose(chain(print), readFile)
const catFirstChar_v3 = R.compose(chain(head), cat_v3)

console.log("[do: catFirstChar_v3]")
result = catFirstChar_v3('index.ts');
console.log("[done: catFirstChar_v3]")
console.log("result", result)
