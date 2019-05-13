const http2 = require( "http2" );
const qs = require( "querystring" );
const crypto = require( "crypto" );
const cookie = require( "cookie" );

/**
 * Prefix to cookies
 * Proxy method transfers finteza cookies to the first-party domain
 * The prefix is needed so that there would be no conflict with the other cookies
 *
 * @const {string}
 */
const COOKIES_PREFIX = "_fz_";

/**
 * List of cookies that should be pass via proxy
 *
 * @const {string[]}
 */
const PROXY_COOKIES = [ "uniq" ];

/**
 * Default value for url
 * Used if url did not specified in functions call
 *
 * @const {string}
 */
const DEFAULT_URL = "https://content.mql5.com";

/**
 * Default user agent
 *
 * @const {string}
 */
const DEFAULT_USER_AGENT = "Finteza Node.JS SDK/1.0";

/**
 * Create only one session for one url
 *
 * @private
 * @param {string} url URL address
 * @return {import("http2").ClientHttp2Session} Client session for this URL
 */
const createConnection = ( function() {
    let client;
    let lastUrl;

    return ( url ) => {
        if ( url !== lastUrl ) {
            client = http2.connect( url );

            client.on( "error", ( err ) => {
                if ( err.errno === "ECONNRESET" ) {
                    client.close();
                    return;
                }

                console.error( "Finteza SDK/HTTP2", err );
            } );
        }

        return client;
    }
} )();

/**
 * Get URL without trailing slash
 *
 * @private
 * @param {string} [optionalUrl] URL address
 * @return {string} URL without trailing slash
 */
function getUrl( optionalUrl ) {
    let url = optionalUrl || DEFAULT_URL;
    if ( url[ url.length - 1 ] === "/" ) {
        url = url.substring( 0, url.length - 1 );
    }

    return url;
}

/**
 * Create normalized path with slash at begin
 *
 * @private
 * @param {string} path Path
 * @return {string} Normalized path with slash at begin
 */
function makePath( rawPath ) {
    let path = rawPath;

    if ( path[ 0 ] !== "/" ) {
        path = `/${path}`;
    }

    if ( path[ path.length - 1 ] === "/" ) {
        path = path.substring( 0, path.length - 1 );
    }

    return path;
}

/**
 * Create Finteza proxy middleware for Express application
 *
 * @public
 * @param {Object} config                   Config for middleware
 * @param {string} config.path              Proxying path
 * @param {string} config.token             Finteza website token
 * @param {string} [config.url]             Proxy target URL
 * @param {number} [config.timeout=15000]   Timeout for waitting response from Finteza
 * @return {import("express").RequestHandler} Express middleware
 */
exports.createProxyMiddleware = function createProxyMiddleware( config ) {
    const url = getUrl( config.url );
    const proxyPath = makePath( config.path || "" );
    const proxyPathRegex = new RegExp( `^${proxyPath}` );

    return function fintezaProxyMiddleware( req, res, next ) {

        // We should proxy from config.path only
        if ( !proxyPathRegex.test( req.path ) ) {
            return next();
        }

        let path = makePath( req.originalUrl.replace( proxyPathRegex, "" ) );

        // Add current host to query for core.js or amp.js
        if ( [ "/core.js", "/amp.js" ].includes( path ) ) {
            path += `?host=${req.secure ? "https://" : "http://"}${req.headers.host}${proxyPath}`;
        }

        const client = createConnection( url );
        const cookies = cookie.parse( req.get( "Cookie" ) );
        const headers = { ":path": path };

        // Proxy user ip and signature for it
        headers[ "X-Forwarded-For" ] = req.ip;
        headers[ "X-Forwarded-For-Sign" ] = crypto.createHash('md5')
            .update( `${req.ip}:${config.token}` )
            .digest( "hex" );

        // Proxy User-Agent
        headers[ "User-Agent" ] = req.get( "User-Agent" );

        // Proxy only defined cookies
        headers[ "Cookie" ] = PROXY_COOKIES
            .map( name => {
                const value = cookies[ `${COOKIES_PREFIX}${name}` ]
                return value && `${name}=${value}`
            })
            .filter( Boolean );

        let data = "";

        // Make request to Finteza
        const proxyReq = client.request( headers )
            .setEncoding( "utf8" )

            // Proxy headers from Finteza
            .on( "response", ( proxyHeaders ) => {
                res.status( parseInt( proxyHeaders[ ":status" ], 10 ) )

                for ( const name in proxyHeaders ) {
                    const headerKey = name.toLowerCase();

                    // Skip headers about Finteza
                    if ( [ "x-powered-by", "server" ].includes( headerKey ) ) {
                        continue;
                    }

                    [].concat( proxyHeaders[ name ] ).forEach( ( headerValue ) => {

                        if ( headerKey[ 0 ] === ":" ) {
                            return;
                        }

                        // Handle set cookie header
                        if ( "set-cookie" !== headerKey ) {
                            res.set( headerKey, Array.isArray( headerValue ) ? headerValue.join() : headerValue );
                            return;
                        }

                        const [ _, cookieName ] = headerValue.match( /^\s*(.*?)=/i );
                        if ( !PROXY_COOKIES.includes( cookieName ) ) {
                            return;
                        }

                        res.set(
                            headerKey,
                            headerValue
                                .replace( /(.*?)=/i, `${COOKIES_PREFIX}$1=`)
                                .replace( /(domain=)(.*?)($|;)/i, `$1${req.headers.host.replace( /:\d+/, "" )}$3` )
                        );
                    } );
                }
            })

            // Collect data and send it to client
            .on( "data", ( chunk ) => {
                data += chunk;
            } )
            .on( "end", () => {
                proxyReq.close();
                res.send( data ).end();
            } );

        // Cancel the stream if there's no activity after timeout
        if ( config.timeout == null || config.timeout > 0 ) {
            proxyReq.setTimeout(config.timeout != null ? config.timeout : 15000, () => proxyReq.close() );
        }
    };
};

/**
 * Send event to Finteza analytics
 *
 * @public
 * @param {Object} params               Params
 * @param {string} params.name          Event name
 * @param {string} params.websiteId     Website ID in Finteza platform
 * @param {string} [params.url]         Proxy target URL
 * @param {string} [params.token]       Finteza website token (it is requred if you pass params.userIp)
 * @param {string} [params.referer]     Referrer for server events
 * @param {string} [params.backReferer] Back referrer for event
 * @param {string} [params.userIp]      User client IP address for event
 * @param {string} [params.userAgent]   User-Agent for event
 * @param {string} [params.value]       Event value param
 * @param {string} [params.unit]        Unit for value param
 */
exports.sendEvent = function sendEvent( params ) {
    const event = params.name.replace( /\s/g, "+" );
    const url = getUrl( params.url );

    const query = qs.stringify( {
        event,
        id: params.websiteId,
        ref: params.referer,
        back_ref: params.backReferer,
        value: params.value,
        unit: params.unit,
    } );

    const client = createConnection( url );
    const headers = { ":path": `/tr?${query}` };

    if ( params.userIp ) {
        headers[ "X-Forwarded-For" ] = params.userIp;
        headers[ "X-Forwarded-For-Sign" ] = crypto.createHash('md5')
            .update( `${params.userIp}:${params.token}` )
            .digest( "hex" );
    }

    headers[ "User-Agent" ] = params.userAgent || DEFAULT_USER_AGENT;

    // Make request to Finteza and forgot about it
    client.request( headers );
};
