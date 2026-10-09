tell application "Google Chrome"
  execute front window's active tab javascript "
    // Find a link that contains 'Aromaniak Web' and click it
    let links = document.querySelectorAll('a');
    let clicked = false;
    for (let link of links) {
      if (link.innerText.includes('Aromaniak Web.')) {
        link.click();
        clicked = true;
        break;
      }
    }
    clicked ? 'Clicked' : 'Not found';
  "
end tell
