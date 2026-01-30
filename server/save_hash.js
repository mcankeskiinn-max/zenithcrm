const bcrypt = require('bcryptjs');
const fs = require('fs');
const password = 'zenith2024';

bcrypt.hash(password, 10).then(hash => {
    fs.writeFileSync('final_hash.txt', hash);
    console.log('Hash saved to final_hash.txt');
});
