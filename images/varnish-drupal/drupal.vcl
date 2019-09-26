vcl 4.0;

import std;
import dynamic;

# set backend default
backend default {
  .host = "${VARNISH_BACKEND_HOST:-nginx}";
  .port = "${VARNISH_BACKEND_PORT:-8080}";
  .first_byte_timeout = 35m;
  .between_bytes_timeout = 10m;
}

# Allow purging from localhost
# @TODO allow from openshift network
acl purge {
      "127.0.0.1";
      "10.0.0.0"/8;
      "172.16.0.0"/12;
      "192.168.0.0"/16;
}

sub vcl_init {
  new www_dir = dynamic.director(
    port = "${VARNISH_BACKEND_PORT:-8080}",
    first_byte_timeout = 90s,
    between_bytes_timeout = 90s,
    ttl = 60s);
}

# This configuration is optimized for Drupal hosting:
# Respond to incoming requests.
sub vcl_recv {
  if (req.url ~ "^/varnish_status$")  {
    return (synth(200,"OK"));
  }
  # set the backend, which should be used:
  set req.backend_hint = www_dir.backend("${VARNISH_BACKEND_HOST:-nginx}");

  # Always set the forward ip.
   if (req.restarts == 0) {
     if (req.http.x-forwarded-for) {
         set req.http.X-Forwarded-For =  req.http.X-Forwarded-For + ", " + client.ip;
     } else {
         set req.http.X-Forwarded-For = client.ip;
     }
   }



  if (req.http.X-LAGOON-VARNISH ) {
    ## Pass all Requests which are handled via an upstream Varnish
    set req.http.X-LAGOON-VARNISH = "${HOSTNAME}-${LAGOON_GIT_BRANCH:-undef}-${LAGOON_PROJECT}, " + req.http.X-LAGOON-VARNISH;
    set req.http.X-LAGOON-VARNISH-BYPASS = "true";
  } else if (req.http.Fastly-FF) {
    ## Pass all Requests which are handled via Fastly
    set req.http.X-LAGOON-VARNISH = "${HOSTNAME}-${LAGOON_GIT_BRANCH:-undef}-${LAGOON_PROJECT}, fastly";
    set req.http.X-LAGOON-VARNISH-BYPASS = "true";
    set req.http.X-Forwarded-For = req.http.Fastly-Client-IP;
  } else if (req.http.CF-RAY) {
    ## Pass all Requests which are handled via CloudFlare
    set req.http.X-LAGOON-VARNISH = "${HOSTNAME}-${LAGOON_GIT_BRANCH:-undef}-${LAGOON_PROJECT}, cloudflare";
    set req.http.X-LAGOON-VARNISH-BYPASS = "true";
    set req.http.X-Forwarded-For = req.http.CF-Connecting-IP;
  } else if (req.http.X-Pull) {
    ## Pass all Requests which are handled via KeyCDN
    set req.http.X-LAGOON-VARNISH = "${HOSTNAME}-${LAGOON_GIT_BRANCH:-undef}-${LAGOON_PROJECT}, keycdn";
    set req.http.X-LAGOON-VARNISH-BYPASS = "true";
  } else {
    ## We set a header to let a Varnish Chain know that it already has been varnishcached
    set req.http.X-LAGOON-VARNISH = "${HOSTNAME}-${LAGOON_GIT_BRANCH:-undef}-${LAGOON_PROJECT}";

    ## Allow to bypass based on env variable `VARNISH_BYPASS`
    set req.http.X-LAGOON-VARNISH-BYPASS = "${VARNISH_BYPASS:-false}";
  }

  # Websockets are piped
  if (req.http.Upgrade ~ "(?i)websocket") {
      return (pipe);
  }

  if (req.http.X-LAGOON-VARNISH-BYPASS == "true" || req.http.X-LAGOON-VARNISH-BYPASS == "TRUE") {
    return (pass);
  }

  # SA-CORE-2014-004 preventing access to /xmlrpc.php
  if (req.url ~ "^/xmlrpc.php$") {
    return (synth(701, "Unauthorized"));
  }

  # Strip out Google Analytics campaign variables. They are only needed
  # by the javascript running on the page
  # utm_source, utm_medium, utm_campaign, gclid
   if(req.url ~ "(\?|&)(gclid|utm_[a-z]+)=") {
     set req.url = regsuball(req.url, "(gclid|utm_[a-z]+)=[^\&]+&?", "");
     set req.url = regsub(req.url, "(\?|&)$", "");
   }

  # Bypass a cache hit (the request is still sent to the backend)
  if (req.method == "REFRESH") {
      if (!client.ip ~ purge) { return (synth(405, "Not allowed")); }
      set req.method = "GET";
      set req.hash_always_miss = true;
  }

  # Only allow BAN requests from IP addresses in the 'purge' ACL.
  if (req.method == "BAN" || req.method == "URIBAN" || req.method == "PURGE") {
      # Only allow BAN from defined ACL
      if (!client.ip ~ purge) {
          return (synth(403, "Your IP is not allowed."));
      }

      # Only allows BAN if the Host Header has the style of with "${SERVICE_NAME:-varnish}:8080" or "${SERVICE_NAME:-varnish}".
      # Such a request is only possible from within the Docker network, as a request from external goes trough the Kubernetes Router and for that needs a proper Host Header
      if (!req.http.host ~ "^${SERVICE_NAME:-varnish}(:\d+)?$") {
          return (synth(403, "Only allowed from within own network."));
      }

      if (req.method == "BAN") {
        # Logic for the ban, using the Cache-Tags header.
        if (req.http.Cache-Tags) {
            ban("obj.http.Cache-Tags ~ " + req.http.Cache-Tags);
            # Throw a synthetic page so the request won't go to the backend.
            return (synth(200, "Ban added."));
        }
        else {
            return (synth(403, "Cache-Tags header missing."));
        }
      }

      if (req.method == "URIBAN" || req.method == "PURGE") {
        ban("req.url ~ " + req.url);
        # Throw a synthetic page so the request won't go to the backend.
        return (synth(200, "Ban added."));
      }

  }

  # Non-RFC2616 or CONNECT which is weird, we pipe that
  if (req.method != "GET" &&
    req.method != "HEAD" &&
    req.method != "PUT" &&
    req.method != "POST" &&
    req.method != "TRACE" &&
    req.method != "OPTIONS" &&
    req.method != "DELETE") {
     return (pipe);
  }

  # We only try to cache  GET and HEAD, other things are passed
  if (req.method != "GET" && req.method != "HEAD") {
    return (pass);
  }

  # Any requests with Basic Auth are passed
  if (req.http.Authorization || req.http.Authenticate)
  {
    return (pass);
  }

  ## Pass requests which are from blackfire
  if (req.http.X-Blackfire-Query) {
    return (pass);
  }

  # Some URLs should never be cached
  if (req.url ~ "^/status\.php$" ||
      req.url ~ "^/update\.php$" ||
      req.url ~ "^/admin([/?]|$).*$" ||
      req.url ~ "^/info([/?]|$).*$" ||
      req.url ~ "^/flag([/?]|$).*$" ||
      req.url ~ "^.*/system/files([/?]|$).*$" ||
      req.url ~ "^/cgi" ||
      req.url ~ "^/cgi-bin"
  ) {
    return (pass);
  }

  # Plupload likes to get piped
  if (req.url ~ "^.*/plupload-handle-uploads.*$"
  ) {
    return (pipe);
  }

  # Handle compression correctly. Different browsers send different
  # "Accept-Encoding" headers, even though they mostly all support the same
  # compression mechanisms. By consolidating these compression headers into
  # a consistent format, we can reduce the size of the cache and get more hits.=
  # @see: http:// varnish.projects.linpro.no/wiki/FAQ/Compression
  if (req.http.Accept-Encoding) {
    if (req.http.Accept-Encoding ~ "gzip") {
      # If the browser supports it, we'll use gzip.
      set req.http.Accept-Encoding = "gzip";
    }
    else if (req.http.Accept-Encoding ~ "deflate") {
      # Next, try deflate if it is supported.
      set req.http.Accept-Encoding = "deflate";
    }
    else {
      # Unknown algorithm. Remove it and send unencoded.
      unset req.http.Accept-Encoding;
    }
  }

  # Always cache the following file types for all users.
  if (req.url ~ "(?i)\.(css|js|jpg|jpeg|gif|ico|png|tiff|tif|img|tga|wmf|swf|html|htm|woff|woff2|mp4|ttf|eot|svg)(\?.*)?$") {
    unset req.http.Cookie;
  }

  # Remove all cookies that Drupal doesn't need to know about. ANY remaining
  # cookie will cause the request to pass-through to a backend. For the most part
  # we always set the NO_CACHE cookie after any POST request, disabling the
  # Varnish cache temporarily. The session cookie allows all authenticated users
  # to pass through as long as they're logged in.
  #
  # 1. Append a semi-colon to the front of the cookie string.
  # 2. Remove all spaces that appear after semi-colons.
  # 3. Match the cookies we want to keep, adding the space we removed
  #    previously, back. (\1) is first matching group in the regsuball.
  # 4. Remove all other cookies, identifying them by the fact that they have
  #    no space after the preceding semi-colon.
  # 5. Remove all spaces and semi-colons from the beginning and end of the
  #    cookie string.
  if (req.http.Cookie) {
    set req.http.CookieCheck = ";" + req.http.Cookie;
    set req.http.CookieCheck = regsuball(req.http.CookieCheck, "; +", ";");
    set req.http.CookieCheck = regsuball(req.http.CookieCheck, ";(${VARNISH_COOKIECHECK:-SESS[a-z0-9]+|SSESS[a-z0-9]+|NO_CACHE})=", "; \1=");
    set req.http.CookieCheck = regsuball(req.http.CookieCheck, ";[^ ][^;]*", "");
    set req.http.CookieCheck = regsuball(req.http.CookieCheck, "^[; ]+|[; ]+$", "");

    set req.http.Cookie = req.http.Cookie + ";";

    if (req.http.CookieCheck == "") {
      # If there are no remaining cookies, remove the cookie header. If there
      # aren't any cookie headers, Varnish's default behavior will be to cache
      # the page.

      unset req.http.CookieCheck;
      unset req.http.Cookie;
    }
    else {
      # If there is any cookies left (a session or NO_CACHE cookie), do not
      # cache the page. Pass it on to Apache directly.
      unset req.http.CookieCheck;
      return (pass);
    }
  }

  # Cacheable, lookup in cache.
  return (hash);
}

sub vcl_pipe {
  # Support for Websockets
  if (req.http.upgrade) {
      set bereq.http.upgrade = req.http.upgrade;
      set bereq.http.connection = req.http.connection;
  }
}

sub vcl_hit {
    if (obj.ttl >= 0s) {
        # normal hit
        return (deliver);
    }
    # We have no fresh fish. Lets look at the stale ones.
    if (std.healthy(req.backend_hint)) {
        # Backend is healthy. If the object is not older then 30secs, deliver it to the client
        # and automatically create a separate backend request to warm the cache for this request.
        if (obj.ttl + 30s > 0s) {
            set req.http.grace = "normal(limited)";
            return (deliver);
        } else {
            # No candidate for grace. Fetch a fresh object.
            return(miss);
        }
    } else {
        # backend is sick - use full grace
        if (obj.ttl + obj.grace > 0s) {
            set req.http.grace = "full";
            return (deliver);
        } else {
            # no graced object.
            return (miss);
        }
    }
}

sub vcl_backend_response {
  # Allow items to be stale if needed.
  set beresp.grace = 6h;

  # Set ban-lurker friendly custom headers.
  set beresp.http.X-Url = bereq.url;
  set beresp.http.X-Host = bereq.http.host;

  # If the backend sends a X-LAGOON-VARNISH-BACKEND-BYPASS header we directly deliver
  if(beresp.http.X-LAGOON-VARNISH-BACKEND-BYPASS == "TRUE") {
    return (deliver);
  }

  # Cache 404 and 403 for 10 seconds
  if(beresp.status == 404 || beresp.status == 403) {
    set beresp.ttl = 10s;
    return (deliver);
  }

  # Don't allow static files to set cookies.
  if (bereq.url ~ "(?i)\.(css|js|jpg|jpeg|gif|ico|png|tiff|tif|img|tga|wmf|swf|html|htm|woff|woff2|mp4|ttf|eot|svg)(\?.*)?$") {
    # beresp == Back-end response from the web server.
    unset beresp.http.set-cookie;
    unset beresp.http.Cache-Control;

    # If an asset would come back with statuscode 500 we only cache it for 10 seconds instead of the usual static file cache
    if (beresp.status == 500) {
      set beresp.ttl = 10s;
      return (deliver);
    }

    set beresp.ttl = ${VARNISH_ASSETS_TTL:-2628001}s;
    set beresp.http.Cache-Control = "public, max-age=${VARNISH_ASSETS_TTL:-2628001}";
    set beresp.http.Expires = "" + (now + beresp.ttl);
  }
  # Disable buffering only for BigPipe responses
  if (beresp.http.Surrogate-Control ~ "BigPipe/1.0") {
    set beresp.do_stream = true;
    set beresp.ttl = 0s;
  }

  return (deliver);
}

# Set a header to track a cache HIT/MISS.
sub vcl_deliver {
  if (obj.hits > 0) {
    set resp.http.X-Varnish-Cache = "HIT";
  }
  else {
    set resp.http.X-Varnish-Cache = "MISS";
  }

  # Remove ban-lurker friendly custom headers when delivering to client.
  unset resp.http.X-Url;
  unset resp.http.X-Host;

  # unset Cache-Tags Header by default, can be disabled with VARNISH_SET_HEADER_CACHE_TAGS=true
  if (!${VARNISH_SET_HEADER_CACHE_TAGS:-false}) {
    unset resp.http.Cache-Tags;
  }

  unset resp.http.X-Generator;
  unset resp.http.Server;
  # Inject information about grace
  if (req.http.grace) {
    set resp.http.X-Varnish-Grace = req.http.grace;
  }
  set resp.http.X-LAGOON = "${HOSTNAME}-${LAGOON_GIT_BRANCH:-undef}-${LAGOON_PROJECT}>" + resp.http.X-LAGOON;
  return (deliver);
}

sub vcl_hash {
     hash_data(req.url);
     if (req.http.host) {
         hash_data(req.http.host);
     } else {
         hash_data(server.ip);
     }
     if (req.http.X-Forwarded-Proto) {
        hash_data(req.http.X-Forwarded-Proto);
     }
     if (req.http.HTTPS) {
        hash_data(req.http.HTTPS);
     }
  return (lookup);
}

sub vcl_synth {
  if (resp.status == 701) {
    set resp.status = 401;
    set resp.http.Content-Type = "text/plain; charset=utf-8";
    synthetic({"XMLRPC Interface is blocked due to SA-CORE-2014-004 - mail support@amazee.io if you need it."});
    return (deliver);
  }
  if (resp.status == 700) {
    # Set a status the client will understand
    set resp.status = 200;
    # Create our synthetic response
    synthetic("");
    return(deliver);
}
  return (deliver);
}

sub vcl_backend_error {
    # Restart the request, when we have a backend server error, to try another backend.
    # Restart max twice.
    if (bereq.retries < 2) {
      return(retry);
    }

    set beresp.http.Content-Type = "text/html; charset=utf-8";
    set beresp.http.Retry-After = "5";
    synthetic( {"
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Server Error</title>
    <style type="text/css">
    body {
        font-family: helvetica, arial, sans-serif;
    }
    img {
        margin-top: 50px;
    }
    p {
        width: 6 00px;
        margin-top: 10px
    }
    div {
        background: #ccc;
        width: 600px;
        margin: auto;
        padding: 50px;
    }
    span {
        color: #ccc
    }
    </style>
</head>
<body>
    <div>
        <h1>We are sorry...</h1>
        <p>We encountered a server-side error. This means that the problem is not with your computer or Internet connection, but rather with the website's server.</p>
        <p>We are currently working on solving this problem and apologise for the inconvenience.</p>
        <span>
            <strong>Technical Information</strong><br />
            Error "} + beresp.status + " " + beresp.reason + {"<br />
            XID: "} + bereq.xid + {"<br />
        </span>
    </div>
</body>
</html>

"} );
    return (deliver);
}
