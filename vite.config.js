import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getHtmlEntries = () => {
  const pages = {};
  const files = fs.readdirSync(__dirname);
  files.forEach((file) => {
    if (file.endsWith('.html')) {
      const name = file.replace('.html', '');
      pages[name] = resolve(__dirname, file);
    }
  });
  return pages;
};

const preserveFaviconPath = () => ({
  name: 'preserve-favicon-path',
  closeBundle() {
    const outDir = resolve(__dirname, 'dist');
    const faviconSrc = resolve(__dirname, 'img/favicon.png');
    const faviconDestDir = resolve(outDir, 'img');
    const faviconDest = resolve(faviconDestDir, 'favicon.png');

    if (fs.existsSync(faviconSrc)) {
      fs.mkdirSync(faviconDestDir, { recursive: true });
      fs.copyFileSync(faviconSrc, faviconDest);
    }

    fs.readdirSync(outDir)
      .filter((file) => file.endsWith('.html'))
      .forEach((file) => {
        const htmlPath = resolve(outDir, file);
        const html = fs.readFileSync(htmlPath, 'utf8')
          .replace(/href="\/assets\/favicon-[^"]+\.png"/g, 'href="/img/favicon.png"');
        fs.writeFileSync(htmlPath, html);
      });
  }
});

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: getHtmlEntries(),
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'js/**/*',
          dest: 'js'
        },
        {
          src: 'bds_admin/**/*',
          dest: 'bds_admin'
        },
        {
          src: 'include/**/*',
          dest: 'include'
        }
      ]
    }),
    preserveFaviconPath()
  ],
  server: {
    port: 3000,
    open: true,
  },
});
