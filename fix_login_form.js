const fs = require('fs');
const file = 'src/app/login/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/onSubmit=\{handleLoginWithCredentials\}/g, 'onSubmit={handleLoginWithCredentialsForm}');

const newLogic = `
  const handleLoginWithCredentialsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/kode/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password: password, isPin: false })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.user.rol === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/pos');
        }
      } else {
        setError(data.error || 'Credenciales inválidas.');
      }
    } catch (e) {
      setError('Error de red.');
    } finally {
      setIsLoggingIn(false);
    }
  };
`;

code = code.replace(/const handleGoogleLogin = \(\) => \{/, newLogic + '\n  const handleGoogleLogin = () => {');

fs.writeFileSync(file, code);
console.log('Fixed Login Form');
