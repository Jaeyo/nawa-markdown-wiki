var platform = require('platform');

console.log(platform.name);
console.log(platform.version);
console.log(platform.os.architecture);
console.log(platform.os.family);
console.log(platform.description);

console.log({ platform: platform });