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
      // Function to simulate typing
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        
        if (valueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else {
          valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // We just need to give the user the script to run, or we try to find the inputs
      let inputs = document.querySelectorAll('input, textarea');
      // Vercel env var page has a key input and a value textarea
      let keyInput = Array.from(inputs).find(el => el.placeholder && el.placeholder.includes('EXAMPLE_NAME'));
      let valInput = Array.from(inputs).find(el => el.tagName === 'TEXTAREA' || (el.placeholder && el.placeholder.includes('value')));
      
      if (keyInput && valInput) {
        setNativeValue(keyInput, 'GOOGLE_CLIENT_ID');
        setNativeValue(valInput, '817173968961-r1q8uu8cl3rtjekffu4269cod2roffaj.apps.googleusercontent.com');
        
        // Find the 'Save' or 'Add' button
        setTimeout(() => {
          let buttons = document.querySelectorAll('button');
          let addBtn = Array.from(buttons).find(b => b.innerText && b.innerText.includes('Save'));
          if(addBtn) addBtn.click();
        }, 500);
        
        'Injected First Var';
      } else {
        'Inputs not found';
      }
    "
  end if
end tell
