tell application "Google Chrome"
  execute front window's active tab javascript "
    (function() {
      let options = document.querySelectorAll('mat-option, [role=\"option\"]');
      for (let opt of options) {
        if (opt.innerText && opt.innerText.includes('Aplicación web')) {
          opt.click();
          return 'Selected Aplicación web';
        }
      }
      return 'Option not found';
    })();
  "
end tell
