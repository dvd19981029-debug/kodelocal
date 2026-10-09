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
    execute targetTab javascript "
      Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('/kode10/')).join(', ');
    "
  else
    return "Not found"
  end if
end tell
