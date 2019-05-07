# Sockethub-welten:

[![Greenkeeper badge](https://badges.greenkeeper.io/michielbdejong/welten.svg)](https://greenkeeper.io/)

## Adding persistence to sockethub

This is an experimental companion to sockethub which adds persistence:

* keeping user credentials stored when the user is not there
* listening on TCP ports even when the user is not there
* carrying out 'delivery boy' tasks, like saving incoming messages to your inbox

# To run:
    npm install
    cp -r data-sample/ data/
    # now edit data/config.js
    node welten.js ./data/

If you don't have a TLS cert, you can run over http on localhost (just remove the whole 'https' config entry), or generate a self-signed one with:

     openssl req -subj '/CN=Welten WebSocket Service/' -newkey rsa:2048 -new -x509 -days 3652 -nodes -out tls.cert -keyout tls.key

Do make sure you visit the configured https host/port with your browser once, and tell it to accept the self-signed certificate before trying to connect to that port with a WebSocket.
