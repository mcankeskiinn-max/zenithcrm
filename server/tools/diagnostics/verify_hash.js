const bcrypt = require('bcryptjs');
const password = '858828..mck';

bcrypt.hash(password, 10).then(hash => {
    console.log('PASSWORD:', password);
    console.log('HASH:', hash);

    bcrypt.compare(password, hash).then(match => {
        console.log('VERIFICATION MATCH:', match);
    });
});
