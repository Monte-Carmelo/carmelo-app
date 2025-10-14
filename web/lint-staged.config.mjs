const config = {
  '*.{ts,tsx}': ['next lint --max-warnings=0 --file'],
  '*.{ts,tsx,js,jsx,json,css,md}': ['prettier --write'],
};

export default config;
