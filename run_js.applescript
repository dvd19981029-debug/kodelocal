tell application "Google Chrome"
  execute front window's active tab javascript "
    let matches = document.body.innerHTML.match(/[0-9]+-[a-zA-Z0-9_]+\\.apps\\.googleusercontent\\.com/g);
    matches ? Array.from(new Set(matches)).join(', ') : 'No Client IDs found';
  "
end tell
