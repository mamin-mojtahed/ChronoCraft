/** @type {import('next').NextConfig} */

// Determine base path for deployment:
// 1. Explicit NEXT_PUBLIC_BASE_PATH (can be empty string for custom domains or set to repository name)
// 2. In GitHub Actions, automatically detect from GITHUB_REPOSITORY (e.g. /ChronoCraft)
// 3. Fallback to empty string for standard local development
const getBasePath = () => {
  if (process.env.NEXT_PUBLIC_BASE_PATH !== undefined) {
    return process.env.NEXT_PUBLIC_BASE_PATH;
  }
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    if (repoName && !repoName.endsWith('.github.io')) {
      return `/${repoName}`;
    }
  }
  return '';
};

const basePath = getBasePath();
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  ...(isStaticExport ? { output: 'export' } : {}),
  images: {
    unoptimized: isStaticExport,
  },
  trailingSlash: isStaticExport,
  basePath: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;

