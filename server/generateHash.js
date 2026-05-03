    const bcrypt = require('bcrypt');
    const password = '123456@aA';
    const saltRounds = 10; // Use the same salt rounds as your registration logic

    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            console.error(err);
        } else {
            console.log('Bcrypt hash:', hash);
        }
    });