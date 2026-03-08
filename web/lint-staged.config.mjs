const config = {
  '*.{ts,tsx,js,jsx,mjs}': ['eslint --max-warnings=0 --fix --no-warn-ignored'],
  '*.{ts,tsx,js,jsx,json,css,md}': ['prettier --write'],
};

export default config;
