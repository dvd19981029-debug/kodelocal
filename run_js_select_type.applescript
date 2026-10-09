tell application "Google Chrome"
  execute front window's active tab javascript "
    (function() {
      // Find the mat-select or dropdown for Tipo de aplicación
      let selects = document.querySelectorAll('mat-select, select, [role=\"combobox\"]');
      if(selects.length > 0) {
        selects[0].click(); // Open dropdown
        return 'Dropdown clicked';
      }
      return 'Dropdown not found';
    })();
  "
end tell
