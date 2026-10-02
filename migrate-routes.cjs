const fs = require('fs');
const path = require('path');

const dir = 'e:/Products/plotthechart/src/routes';

const appRoutes = [
  'workspace.tsx', 'saved-projects.tsx', 'about.tsx', 
  'chart-maker.tsx', 'area-chart-maker.tsx', 'bar-chart-maker.tsx', 
  'donut-chart-maker.tsx', 'graph-maker.tsx', 'histogram-maker.tsx', 
  'line-chart-maker.tsx', 'pie-chart-maker.tsx', 'scatter-plot-maker.tsx'
];

const publicRoutes = [
  'index.tsx', 'signin.tsx', 'signup.tsx', 'verify-email.tsx'
];

for (const file of appRoutes) {
  const oldPath = path.join(dir, file);
  if (!fs.existsSync(oldPath)) continue;
  
  let content = fs.readFileSync(oldPath, 'utf8');
  let routeName = file === 'index.tsx' ? '/' : '/' + file.replace('.tsx', '');
  let newRouteName = '/_app' + (routeName === '/' ? '' : routeName);
  
  content = content.replace(/createFileRoute\(['"`].*?['"`]\)/g, `createFileRoute('${newRouteName}')`);
  
  const newPath = path.join(dir, '_app.' + file);
  fs.writeFileSync(newPath, content);
  fs.unlinkSync(oldPath);
}

for (const file of publicRoutes) {
  const oldPath = path.join(dir, file);
  if (!fs.existsSync(oldPath)) continue;
  
  let content = fs.readFileSync(oldPath, 'utf8');
  let routeName = file === 'index.tsx' ? '/' : '/' + file.replace('.tsx', '');
  let newRouteName = '/_public' + (routeName === '/' ? '/' : routeName);
  
  content = content.replace(/createFileRoute\(['"`].*?['"`]\)/g, `createFileRoute('${newRouteName}')`);
  
  const newPath = path.join(dir, '_public.' + file);
  fs.writeFileSync(newPath, content);
  fs.unlinkSync(oldPath);
}

console.log('Done migrating routes.');
