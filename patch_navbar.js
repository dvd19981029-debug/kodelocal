const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove isSwitchUserOpen
code = code.replace(/const \[isSwitchUserOpen, setIsSwitchUserOpen\] = useState\(false\);\n/, '');

// 2. Remove users state
code = code.replace(/const \[users, setUsers\] = useState<UserAccount\[\]>\(\[\]\);\n/, '');
code = code.replace(/setUsers\(getStoredUsers\(\)\);\n/, '');

// 3. Remove handleQuickSwitch
code = code.replace(/const handleQuickSwitch = \([\s\S]*?\};\n\n/, '');

// 4. Modify handleLogout to also clear cookies by fetching a logout API
const newLogout = `
  const handleLogout = async () => {
    try {
      await fetch('/api/kode/auth/logout', { method: 'POST' });
    } catch(e) {}
    if (typeof document !== 'undefined') {
      document.cookie = 'kode_session_ui=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    setActiveUser(null);
    router.push('/login');
  };
`;
code = code.replace(/const handleLogout = \([\s\S]*?router\.push\('\/login'\);\n\s*\};\n/, newLogout);

// 5. Remove the SwitchUser dropdown UI
// The dropdown is likely inside a relative div around the user profile. I'll just write a script to replace the whole user profile section.
