const mongoose = require('mongoose');

const {
    MONGODB_USERNAME,
    MONGODB_PASSWORD,
    MONGODB_HOST,
    MONGODB_PORT,
    MONGODB_DATABASE,
    MONGODB_AUTHSOURCE,
    MONGODB_AUTHTLS
} = process.env;

const options = {
    useNewUrlParser: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 500,
    connectTimeoutMS: 10000,
};

let authTLSString = "";
if (MONGODB_AUTHTLS == "True") {
    authTLSString = "ssl=true&sslInsecure=true&tls=true&tlsInsecure=true";
    if (MONGODB_AUTHSOURCE != "") {
        authTLSString = `authSource=${MONGODB_AUTHSOURCE}&ssl=true&sslInsecure=true&tls=true&tlsInsecure=true`;
    }
}

const url = `mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?${authTLSString}`;

console.log(url);

mongoose.connect(url, options).then( function() {
    console.log('MongoDB is connected');
})
    .catch( function(err) {
    console.log(err);
    process.exit()
});