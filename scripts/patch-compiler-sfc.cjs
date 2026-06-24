const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', '@vue', 'compiler-sfc', 'dist', 'compiler-sfc.cjs.js');

if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Patch magic-string
  content = content.replace(
    /var MagicString = require\('magic-string'\);/g, 
    "var _ms = require('magic-string'); var MagicString = _ms.default || _ms;"
  );
  
  // Patch postcss
  // The rollup output usually looks like: var require$$0$1 = require('postcss');
  // We will find all require('postcss') assignments
  content = content.replace(
    /var ([a-zA-Z0-9_$]+) = require\('postcss'\);/g,
    "var _pc = require('postcss'); var $1 = _pc.default || _pc;"
  );

  // Also catch postcss used directly
  content = content.replace(
    /require\$\$0\$1\(plugins\)\.process/g,
    "(require$$$$0$1.default || require$$$$0$1)(plugins).process"
  );
  
  // Also catch source-map-js
  content = content.replace(
    /var ([a-zA-Z0-9_$]+) = require\('source-map-js'\);/g,
    "var _sm = require('source-map-js'); var $1 = _sm.default || _sm;"
  );

  fs.writeFileSync(file, content, 'utf-8');
  console.log('Successfully patched @vue/compiler-sfc for Vitest CJS bug');
} else {
  console.log('Could not find @vue/compiler-sfc to patch');
}
