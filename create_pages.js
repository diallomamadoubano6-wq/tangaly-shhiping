const fs = require('fs');
const path = require('path');
const pages = ['cms', 'pages', 'blog', 'faq', 'media', 'expenses', 'invoices', 'transfers', 'services', 'tarifs', 'agences'];
const base = 'src/app/admin';

pages.forEach(p => {
  const dir = path.join(base, p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const componentName = p.charAt(0).toUpperCase() + p.slice(1);
  fs.writeFileSync(path.join(dir, 'page.tsx'), `import React from 'react';

export default function ${componentName}Page() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Module en construction</h2>
      <p>Cette section sera bientôt disponible.</p>
    </div>
  );
}`);
});
console.log('Pages created!');
