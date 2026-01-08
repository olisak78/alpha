def is_real_uri: (type=="string") and (test("^(https?://|file://)"));

def fileuri_to_path:
  if (type=="string") then sub("^file://"; "") else . end;

def abs_to_rel:
  if (type=="string") then
    . as $u
    | ($u | fileuri_to_path) as $p
    | if ($p | test("^/")) then
        if ($p | startswith($ROOT + "/")) then
          ($p | sub("^" + ($ROOT + "/"); ""))
        else
          $p
        end
      else
        $u
      end
  else . end;

(.runs[]?.tool.driver.rules[]? |= ( if (.helpUri | is_real_uri) then . else del(.helpUri) end ))
| (.runs[]?.tool.extensions[]?.rules[]? |= ( if (.helpUri | is_real_uri) then . else del(.helpUri) end ))
| (.runs[]?.results[]?.locations[]?.physicalLocation.artifactLocation.uri) |= abs_to_rel
| (.runs[]?.artifacts[]?.location.uri) |= abs_to_rel
