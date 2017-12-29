if os.getenv('LAGOON_ENVIRONMENT_TYPE') == 'development' then
  ngx.header["X-Robots-Tag"] = 'noindex, nofollow'
end