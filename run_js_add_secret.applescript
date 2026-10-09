tell application "Google Chrome"
  execute front window's active tab javascript "
    let btns = document.querySelectorAll('button, a, span');
    let clicked = false;
    for (let btn of btns) {
      if (btn.innerText && btn.innerText.includes('Add secret')) {
        btn.click();
        clicked = true;
        break;
      }
    }
    clicked ? 'Clicked' : 'Not found';
  "
end tell
