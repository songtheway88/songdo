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

const createSitesEntrypoint = () => ({
  name: 'create-sites-entrypoint',
  closeBundle() {
    const outDir = resolve(__dirname, 'dist');
    const serverDir = resolve(outDir, 'server');
    const openaiDir = resolve(outDir, '.openai');
    const hostingSrc = resolve(__dirname, '.openai/hosting.json');
    const hostingDest = resolve(openaiDir, 'hosting.json');
    const serverDest = resolve(serverDir, 'index.js');

    fs.mkdirSync(serverDir, { recursive: true });
    fs.mkdirSync(openaiDir, { recursive: true });

    if (fs.existsSync(hostingSrc)) {
      fs.copyFileSync(hostingSrc, hostingDest);
    }

    fs.writeFileSync(serverDest, `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404) {
      return response;
    }

    if (!url.pathname.includes('.')) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    return response;
  }
};
`);
  }
});

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: ['chrome60', 'firefox60', 'safari11', 'edge18'],
    cssTarget: ['chrome60', 'firefox60', 'safari11', 'edge18'],
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
    preserveFaviconPath(),
    createSitesEntrypoint()
  ],
  server: {
    port: 3000,
    open: true,
  },
});
