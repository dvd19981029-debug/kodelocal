const fs = require('fs');
const file = 'src/app/admin/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fetch staff users on mount
code = code.replace(/const \[users, setUsers\] = useState<UserAccount\[\]>\(\[\]\);/, `const [users, setUsers] = useState<UserAccount[]>([]);
  useEffect(() => {
    fetch('/api/staff')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.staff)) {
          setUsers(data.staff);
        }
      })
      .catch(err => console.error('Error loading staff', err));
  }, []);`);

// 2. Patch handleSaveUser
const saveUserOld = `
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setUsers(prev => {
      const exists = prev.find(u => u.id === editingUser.id);
      if (exists) {
        return prev.map(u => u.id === editingUser.id ? { ...editingUser, createdAt: u.createdAt } : u);
      } else {
        return [{ ...editingUser, id: 'user-' + Date.now() }, ...prev];
      }
    });
    
    setIsUserModalOpen(false);
    setEditingUser(null);
  };
`;
const saveUserNew = `
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => {
          const exists = prev.find(u => u.id === data.user.id || u.email === data.user.email);
          if (exists) {
            return prev.map(u => (u.id === exists.id ? { ...data.user, pin: data.user.pin || '0000' } : u));
          }
          return [{ ...data.user, pin: data.user.pin || '0000' }, ...prev];
        });
      }
    } catch(err) {
      console.error(err);
    }
    
    setIsUserModalOpen(false);
    setEditingUser(null);
  };
`;
code = code.replace(/const handleSaveUser = \(e: React\.FormEvent\) => \{[\s\S]*?setEditingUser\(null\);\n  \};/, saveUserNew);

// 3. Patch delete user inline
code = code.replace(/if \(confirm\(\`¿Estás seguro de eliminar el usuario "\\\$\\{u.name\\}"\?\`\)\) \{\n\s*setUsers\(prev => prev\.filter\(x => x\.id !== u\.id\)\);\n\s*\}/, `if (confirm(\`¿Estás seguro de eliminar el usuario "\\\${u.name}"?\`)) {
                                    fetch(\`/api/staff?id=\\\${u.id}\`, { method: 'DELETE' }).then(res => res.json()).then(data => {
                                      if (data.success) setUsers(prev => prev.filter(x => x.id !== u.id));
                                    });
                                  }`);

fs.writeFileSync(file, code);
console.log('Patched Admin Staff UI');
