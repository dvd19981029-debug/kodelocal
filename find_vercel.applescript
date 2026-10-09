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
    set active tab index of targetWindow to (active tab index of targetWindow)
    -- This doesn't activate the tab properly, use this:
    set active tab index of targetWindow to 1
    return "Found Vercel"
  else
    return "Not found"
  end if
end tell
