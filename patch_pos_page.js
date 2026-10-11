const fs = require('fs');

const path = 'src/app/pos/page.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  // Add states
  code = code.replace(
    /const \[custNotas, setCustNotas\] = useState\(''\);/,
    "const [custNotas, setCustNotas] = useState('');\n  const [custSpecialEssencePrice, setCustSpecialEssencePrice] = useState('');\n  const [custSpecialBottlePrice, setCustSpecialBottlePrice] = useState('');"
  );

  // Add to customerPayload
  code = code.replace(
    /notas: custNotas\.trim\(\) \|\| undefined,/,
    "notas: custNotas.trim() || undefined,\n      specialEssencePrice: custSpecialEssencePrice ? parseFloat(custSpecialEssencePrice) : undefined,\n      specialBottlePrice: custSpecialBottlePrice ? parseFloat(custSpecialBottlePrice) : undefined,"
  );

  // Add to handleEditCustomer
  const handleEditStr = `
  const handleEditCustomer = (c: CustomerRecord) => {
    setEditingCustomerId(c.id);
    setCustTipoPersona(c.tipoPersona || 'NATURAL');
    setCustName(c.name || '');
    setCustNombreComercial(c.nombreComercial || '');
    setCustTipoDocumento(c.tipoDocumento || 'DUI');
    setCustNumDocumento(c.numDocumento || '');
    setCustNrc(c.nrc || '');
    setCustGiro(c.actividadEconomica || GIROS_COMUNES_SV[0]);
    setCustCategoria(c.categoriaContribuyente || 'OTRO');
    setCustDocumentoPreferido(c.documentoPreferido || '01');
    setCustEmail(c.email || '');
    setCustPhone(c.phone || '');
    setCustDepartamento(c.departamento || 'San Salvador');
    setCustMunicipio(c.municipio || 'San Salvador Centro');
    setCustDireccion(c.direccion || '');
    setCustNotas(c.notas || '');
`;
  
  const handleEditNewStr = handleEditStr + `
    setCustSpecialEssencePrice(c.specialEssencePrice ? String(c.specialEssencePrice) : '');
    setCustSpecialBottlePrice(c.specialBottlePrice ? String(c.specialBottlePrice) : '');
`;

  code = code.replace(handleEditStr, handleEditNewStr);

  // Wait, I should also pass them to PosCustomerFormModal
  const modalPropsStr = `
        setCustDireccion={setCustDireccion}
        custNotas={custNotas}
        setCustNotas={setCustNotas}
`;
  const modalPropsNewStr = `
        setCustDireccion={setCustDireccion}
        custNotas={custNotas}
        setCustNotas={setCustNotas}
        custSpecialEssencePrice={custSpecialEssencePrice}
        setCustSpecialEssencePrice={setCustSpecialEssencePrice}
        custSpecialBottlePrice={custSpecialBottlePrice}
        setCustSpecialBottlePrice={setCustSpecialBottlePrice}
`;
  code = code.replace(modalPropsStr, modalPropsNewStr);

  // Reset form helper
  const resetFormStr = `
    setCustDireccion('');
    setCustNotas('');
`;
  const resetFormNewStr = `
    setCustDireccion('');
    setCustNotas('');
    setCustSpecialEssencePrice('');
    setCustSpecialBottlePrice('');
`;
  code = code.replace(resetFormStr, resetFormNewStr);

  fs.writeFileSync(path, code);
  console.log('Patched pos/page.tsx');
}
