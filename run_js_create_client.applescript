tell application "Google Chrome"
  execute front window's active tab javascript "
    (function() {
      let elements = document.querySelectorAll('*');
      for (let el of elements) {
        if (el.innerText && el.innerText.trim() === 'Crear cliente') {
          el.click();
          return 'Clicked Crear cliente';
        }
      }
      return 'Not found';
    })();
  "
end tell
