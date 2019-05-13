const path = require( "path" );
const express = require( "express" );
const finteza = require( "finteza-sdk" );

const app = express();

// Finteza middleware require cookie parser before use
app.use( finteza.createProxyMiddleware( {
    token: "dahhihvyvtjgsbdrdahhihvyvtjgsbdr",
    path: "fz"
} ) );

app.get( "/", ( _req, res ) => {
    res.sendFile( path.join( __dirname, "index.html" ));
} );

app.listen( 8080, () => {
    console.log( "Server started at http://localhost:8080" );

    // Example of server event
    finteza.sendEvent( {
        name: "Server started",
        websiteId: "asxzfntcqewjeanpdbdszsrsxnkakoxbyc"
    } )
} );
