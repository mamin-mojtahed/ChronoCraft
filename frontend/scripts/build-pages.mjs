import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'app', 'api');
const tempApiDir = path.join(process.cwd(), 'app', '_api_disabled');

let moved = false;
try {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, tempApiDir);
    moved = true;
  }
  execSync('next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      STATIC_EXPORT: 'true',
      NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '/ChronoCraft',
    },
  });
} finally {
  if (moved && fs.existsSync(tempApiDir)) {
    fs.renameSync(tempApiDir, apiDir);
  }
}
