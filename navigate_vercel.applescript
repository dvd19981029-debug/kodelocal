tell application "Google Chrome"
  set targetWindow to missing value
  set targetTab to missing value
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t contains "vercel.com" then
        set targetWindow to w
        set targetTab to t
        exit repeat
      end if
    end repeat
    if targetWindow is not missing value then exit repeat
  end repeat
  
  if targetWindow is not missing value then
    set URL of targetTab to "https://vercel.com/kode10/kodelocal/settings/environment-variables"
  end if
end tell
