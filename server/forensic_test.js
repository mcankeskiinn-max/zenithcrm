const bcrypt = require('bcryptjs');
const charCodes = [122, 101, 110, 105, 116, 104, 50, 48, 50, 52];
const password = String.fromCharCode(...charCodes);
const dbHash = '$2b$10$zyjj6MsSB2Qz8EhqjJEyIeInqlanxVkxX66mg.ZpVQG4TeVg7ZmqPi';

console.log('Testing Password:', password);
console.log('Password Length:', password.length);

bcrypt.compare(password, dbHash).then(match => {
    console.log('MATCH RESULT:', match);
});
