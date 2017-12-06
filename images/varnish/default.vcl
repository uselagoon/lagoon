#
# This is an example VCL file for Varnish.
#
# It does not do anything by default, delegating control to the
# builtin VCL. The builtin VCL is called when there is no explicit
# return statement.
#
# See the VCL chapters in the Users Guide at https://www.varnish-cache.org/docs/
# and https://www.varnish-cache.org/trac/wiki/VCLExamples for more examples.

vcl 4.0;

import std;

# set backend default
backend default {
  .host = "${VARNISH_HOST:-nginx}";
  .port = "8080";
  .first_byte_timeout = 35m;
  .between_bytes_timeout = 10m;
}

sub vcl_recv {
  # Happens before we check if we have this in cache already.
  #
  # Typically you clean up the request here, removing cookies you don't need,
  # rewriting the request, etc.

  # set the backend, which should be used:
  set req.backend_hint = default;

  # Needed for Readyness and Liveness checks - do not remove
  if (req.url ~ "^/varnish_status$")  {
    return (synth(700,"OK"));
  }

}

sub vcl_backend_response {
    # Happens after we have read the response headers from the backend.
    #
    # Here you clean the response headers, removing silly Set-Cookie headers
    # and other mistakes your backend does.
}

sub vcl_deliver {
    # Happens when we have all the pieces we need, and are about to send the
    # response to the client.
    #
    # You can do accounting or modifying the final object here.
}